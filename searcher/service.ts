
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
  }

  private async genericSearch(arrayToSearch: Document[], fields: string[], keyword: string): Promise<Document[]> {
    const keywords = keyword.toLowerCase().split(' ');
    const MAXIMUM_RESULT = 300;
    const result = [];
    for (const document of arrayToSearch) {
      if (result.length >= MAXIMUM_RESULT) {
        break;
      }
      const tag = fields.map(param => document.get(param).toString().toLowerCase()).join(' ');
      for (const key of keywords) {
        if (tag.search(key) > -1 || key.search(tag) > -1) {
          result.push(document);
          break;   
        }
      }
    }
    return result;
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