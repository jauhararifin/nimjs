import { Crawler, NicCrawler, Student, Major } from './crawlerutil';
import { 
  MajorModel, StudentModel, LogModel,
  createMajorModel, createStudentModel, createLogModel
} from '../model';
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
    private majorModel: MajorModel = createMajorModel(),
    private studentModel: StudentModel = createStudentModel(),
    private logModel: LogModel = createLogModel()
  ) {
  }

  private async crawlAllMajors(): Promise<string[]> {
    const majorCodes: string[] = [];
    for await (const major of this.crawler.crawlMajors()) {
      try {
        const oldMajor = await this.majorModel.findOne({code: major.code}).exec();
        
        if (oldMajor === undefined || oldMajor === null) {
          const majorInstance = await new this.majorModel({
            code: major.code,
            name: major.name,
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
    let majors = [];
    if (student.nim !== undefined) {
      for (const nim of student.nim) {
        const code = nim.substr(0, 3);
        const major = await this.majorModel.findOne({code}).exec();
        if (!major) {
          log(`Cannot find major with code ${code}`);
        } else {
          majors.push({nim, major});
        }
      }
    }

    const oldStudent = await this.studentModel.findOne({username: student.username}).exec();
        
    if (oldStudent === undefined || oldStudent === null) {
      const studentInstance = await new this.studentModel({
        username: student.username,
        ai3Email: student.ai3Email,
        email: student.email,
        name: student.name,
        majors,
        
        updatedAt: new Date(),
        createdAt: new Date(),
      }).save();
      await new this.logModel({
        issuedAt: new Date(),
        operation: 'insert',
        type: 'student',
        payload: studentInstance, 
      }).save();
    } else if (oldStudent.get('majors').length !== majors.length) {
      const studentInstance = await oldStudent
        .set('majors', majors)
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
    const majors = await this.crawlAllMajors();

    const iterators = majors.map(majorCode => this.crawler.crawlStudents(majorCode, year));
    await this.crawlStudentIterator(iterators);
  }

  async crawlAllStudentsInMajor(majorCode: string): Promise<void> {
    await this.crawlAllMajors();

    const years = [];
    for (let year = 2012; year <= new Date().getFullYear(); year++) {
      years.push(year);
    }

    const iterators = years.map(year => this.crawler.crawlStudents(majorCode, year));
    await this.crawlStudentIterator(iterators);
  }

  async crawlAllStudentsInMajorAndYear(majorCode: string, year: number): Promise<void> {
    await this.crawlAllMajors();

    await this.crawlStudentIterator([this.crawler.crawlStudents(majorCode, year)]);
  }

}

export class NicCrawlerService extends StandardCrawlerService {
  constructor(
    username: string, password: string,
    majorModel: MajorModel = createMajorModel(),
    studentModel: StudentModel = createStudentModel(),
    logModel: LogModel = createLogModel()) {
    super(new NicCrawler(username, password), majorModel, studentModel, logModel);
  }
}