
import { MajorModel, StudentModel, createMajorModel, createStudentModel } from '../model';

import { Document } from 'mongoose';

export interface SearcherService {

  searchMajor(keyword: string): Promise<Document[]>;

  searchStudent(keyword: string): Promise<Document[]>;

}

export class CachedSearcherService implements SearcherService {
  
  private majors: Document[];
  private students: Document[];

  constructor(
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
    this.majors = await this.majorModel.find().sort('id').exec();
    this.students = await this.studentModel.find().sort('id').exec();

    const mapIdMajorsTemp: {[id: string]: Document} = {};
    const mapIdStudentsTemp: {[id: string]: Document} = {};

    for (const major of this.majors) {
      mapIdMajorsTemp[major.id.toString()] = major;
    }

    for (const student of this.students) {
      mapIdStudentsTemp[student.id.toString()] = student;
      const majors = student.get('majors').map(major => `${major.nim} ${major.major.name}`).join(" ");
      student.set('major', majors);
    }
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

  async searchMajor(keyword: string): Promise<Document[]> {
    return this.genericSearch(this.majors, ['name', 'code'], keyword);
  }

  async searchStudent(keyword: string): Promise<Document[]> {
    return this.genericSearch(this.students, ['name', 'majors'], keyword);
  }

}