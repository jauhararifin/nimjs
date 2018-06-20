
import { FacultyModel, MajorModel, StudentModel, createFacultyModel, createMajorModel, createStudentModel } from '../model';

import { Document } from 'mongoose';

export interface SearcherService {

  searchFaculty(keyword: string): Promise<Document[]>;

  searchMajor(keyword: string): Promise<Document[]>;

  searchStudent(keyword: string): Promise<Document[]>;

}

export class CachedSearcherService implements SearcherService {
  
  private faculties: Document[];
  private majors: Document[];
  private students: Document[];

  private mapIdFaculties: {[id: string]: Document};
  private mapIdMajors: {[id: string]: Document};
  private mapIdStudents: {[id: string]: Document};

  constructor(
    private facultyModel: FacultyModel = createFacultyModel(),
    private majorModel: MajorModel = createMajorModel(),
    private studentModel: StudentModel = createStudentModel()
  ) {
    this.scheduleLoadCache();
  }

  private scheduleLoadCache() {
    this.loadCache();
    setTimeout(this.scheduleLoadCache.bind(this), 5000);
  }

  async loadCache() {
    this.faculties = await this.facultyModel.find().sort('id').exec();
    this.majors = await this.majorModel.find().sort('id').exec();
    this.students = await this.studentModel.find().sort('id').exec();

    const mapIdFacultiesTemp: {[id: string]: Document} = {};
    const mapIdMajorsTemp: {[id: string]: Document} = {};
    const mapIdStudentsTemp: {[id: string]: Document} = {};

    for (const faculty of this.faculties) {
      mapIdFacultiesTemp[faculty.id.toString()] = faculty;
    }

    for (const major of this.majors) {
      mapIdMajorsTemp[major.id.toString()] = major;
      major.set('faculty', mapIdFacultiesTemp[major.get('faculty').toString()]);
    }

    for (const student of this.students) {
      mapIdStudentsTemp[student.id.toString()] = student;
      student.set('faculty', mapIdFacultiesTemp[student.get('faculty').toString()]);
      student.set('major', mapIdMajorsTemp[student.get('major').toString()]);
    }

    this.mapIdFaculties = mapIdFacultiesTemp;
    this.mapIdMajors = mapIdMajorsTemp;
    this.mapIdStudents = mapIdStudentsTemp;
  }

  private async genericSearch(arrayToSearch: Document[], fields: string[], keyword: string): Promise<Document[]> {
    const keywords = keyword.toLowerCase().split(' ').filter(val => val.length > 0);
    const MAXIMUM_RESULT = 300;

    const result = arrayToSearch.map(document => {
      const tag = fields.map(param => document.get(param).toString().toLowerCase()).join(' ');
      let score = 0;
      for (const key of keywords) {
        if (tag.search(key) > -1 || key.search(tag) > -1) {
          score++;
        }
      }
      return { score, document };
    })
    .filter(item => item.score > 0)
    .sort((a,b) => b.score - a.score)
    .map(item => item.document);

    return result.slice(0, MAXIMUM_RESULT);
  }

  async searchFaculty(keyword: string): Promise<Document[]> {
    return this.genericSearch(this.faculties, ['name', 'code'], keyword);
  }

  async searchMajor(keyword: string): Promise<Document[]> {
    return this.genericSearch(this.majors, ['name', 'code'], keyword);
  }

  async searchStudent(keyword: string): Promise<Document[]> {
    return this.genericSearch(this.students, ['name', 'nim', 'tpbNim'], keyword);
  }

}