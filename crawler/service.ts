import { Crawler, NicCrawler, Student, Major } from './crawlerutil';
import { FacultyModel, MajorModel, StudentModel, LogModel } from '../model';
import { Document } from 'mongoose';

const log = require('debug')('nimjs-crawler');

export interface CrawlerService {

  crawlAllStudentsInYear(year: number): Promise<void>;

  crawlAllStudentsInMajor(majorCode: string): Promise<void>;

  crawlAllStudentsInMajorAndYear(majorCode: string, year: number): Promise<void>;

}

export class StandardCrawlerService implements CrawlerService {

  constructor(
    private crawler: Crawler,
    private facultyModel: FacultyModel,
    private majorModel: MajorModel,
    private studentModel: StudentModel,
    private logModel: LogModel
  ) {
  }

  private async crawlAllFaculties(): Promise<string[]> {
    const facultyCodes: string[] = [];
    for await (const faculty of this.crawler.crawlFaculties()) {
      try {
        const oldFaculty = await this.facultyModel.findOne({code: faculty.code}).exec();
        
        if (oldFaculty === undefined || oldFaculty === null) {
          const facultyInstance = await new this.facultyModel({
            code: faculty.code,
            name: faculty.name,
            updatedAt: new Date(),
            createdAt: new Date(),
          }).save();
          await new this.logModel({
            issuedAt: new Date(),
            operation: 'insert',
            type: 'faculty',
            payload: facultyInstance, 
          }).save();
        } else if (oldFaculty.get('name') !== faculty.name) {
          const facultyInstance = await oldFaculty
            .set('name', faculty.name)
            .set('updatedAt', new Date())
            .save();
          await new this.logModel({
            issuedAt: new Date(),
            operation: 'update',
            type: 'faculty',
            payload: facultyInstance, 
          }).save();
        }

        facultyCodes.push(faculty.code);
        log(`Faculty ${faculty.code} saved with name ${faculty.name}`);
      } catch (err) {
        log('Cannot save faculty result', faculty, err);
      }
    }
    return facultyCodes;
  }

  private async crawlAllMajors(): Promise<string[]> {
    const majorCodes: string[] = [];
    for await (const major of this.crawler.crawlMajors()) {
      try {
        const faculty = await this.facultyModel.findOne({code: major.facultyCode}).exec();
        if (!faculty) {
          throw new Error('No coresponding faculty found');
        }

        const oldMajor = await this.majorModel.findOne({code: major.code}).exec();
        
        if (oldMajor === undefined || oldMajor === null) {
          const majorInstance = await new this.majorModel({
            code: major.code,
            name: major.name,
            faculty,
            updatedAt: new Date(),
            createdAt: new Date(),
          }).save();
          await new this.logModel({
            issuedAt: new Date(),
            operation: 'insert',
            type: 'major',
            payload: majorInstance, 
          }).save();
        } else if (oldMajor.get('name') !== major.name) {
          const majorInstance = await oldMajor
            .set('name', major.name)
            .set('faculty', faculty)
            .set('updatedAt', new Date())
            .save();
          await new this.logModel({
            issuedAt: new Date(),
            operation: 'update',
            type: 'major',
            payload: majorInstance, 
          }).save();
        }

        majorCodes.push(major.code);
        log(`Major ${major.code} saved with name ${major.name}`);
      } catch (err) {
        log('Cannot save major result', major, err);
      }
    }
    return majorCodes;
  }

  private async saveStudent(student: Student): Promise<void> {
    const faculty = await this.facultyModel.findOne({code: student.facultyCode}).exec();
    if (!faculty) {
      throw new Error('No coresponding faculty found');
    }

    let major: Document = undefined;
    if (student.majorCode !== undefined) {
      major = await this.majorModel.findOne({code: student.majorCode}).exec();
      if (!major) {
        throw new Error('No coresponding major found');
      }
    }

    const oldStudent = await this.studentModel.findOne({tpbNim: student.tpbNim}).exec();
        
    if (oldStudent === undefined || oldStudent === null) {
      const studentInstance = await new this.studentModel({
        username: student.username,
        tpbNim: student.tpbNim,
        nim: student.nim,
        ai3Email: student.ai3Email,
        email: student.email,
        name: student.name,
        faculty: faculty.id,
        major: major.id,
        updatedAt: new Date(),
        createdAt: new Date(),
      }).save();
      await new this.logModel({
        issuedAt: new Date(),
        operation: 'insert',
        type: 'student',
        payload: studentInstance, 
      }).save();
    } else if (oldStudent.get('nim') !== student.nim) {
      const studentInstance = await oldStudent
        .set('nim', student.nim)
        .set('updatedAt', new Date())
        .save();
      await new this.logModel({
        issuedAt: new Date(),
        operation: 'update',
        type: 'student',
        payload: studentInstance, 
      }).save();
    }
  }

  private async crawlStudentIterator(students: Array<AsyncIterableIterator<Student>>): Promise<void> {
    students.forEach(async studentIterator => {
      for await (const student of studentIterator) {
        try {
          await this.saveStudent(student);
          log(`Student ${student.nim} saved with name ${student.name}`);
        } catch (err) {
          log('Cannot save student', student, err);
        }
      }
    });
  }

  async crawlAllStudentsInYear(year: number): Promise<void> {
    const faculties = await this.crawlAllFaculties();
    const majors = await this.crawlAllMajors();

    const iterators = faculties.map(majorCode => this.crawler.crawlStudents(majorCode, year));
    await this.crawlStudentIterator(iterators);
  }

  async crawlAllStudentsInMajor(majorCode: string): Promise<void> {
    const faculties = await this.crawlAllFaculties();
    const majors = await this.crawlAllMajors();

    const years = [];
    for (let year = 2012; year <= new Date().getFullYear(); year++) {
      years.push(year);
    }

    const iterators = years.map(year => this.crawler.crawlStudents(majorCode, year));
    await this.crawlStudentIterator(iterators);
  }

  async crawlAllStudentsInMajorAndYear(majorCode: string, year: number): Promise<void> {
    const faculties = await this.crawlAllFaculties();
    const majors = await this.crawlAllMajors();

    await this.crawlStudentIterator([this.crawler.crawlStudents(majorCode, year)]);
  }

}

export class NicCrawlerService extends StandardCrawlerService {
  constructor(
    username: string, password: string,
    facultyModel: FacultyModel,
    majorModel: MajorModel,
    studentModel: StudentModel,
    logModel: LogModel) {
    super(new NicCrawler(username, password), facultyModel, majorModel, studentModel, logModel);
  }
}