import { Crawler, NicCrawler, Student } from './crawlerutil';
import { FacultyModel, MajorModel, StudentModel } from '../model';
import { Document } from 'mongoose';

const log = require('debug')('nimjs-crawler');

export interface CrawlerService {

  crawlAllStudentsInYear(year: number): Promise<void>;

  crawlAllStudentsInMajor(majorCode: string): Promise<void>;

  crawlAllStudentsInMajorAndYear(majorCode: string, year: number): Promise<void>;

}

export class StandardCrawlerService implements CrawlerService {

  constructor(private crawler: Crawler) {
  }

  private async crawlAllFaculties(): Promise<string[]> {
    const facultyCodes: string[] = [];
    for await (const faculty of this.crawler.crawlFaculties()) {
      try {
        const facultyInstance = {
          code: faculty.code,
          name: faculty.name,
          updatedAt: new Date(),
          $setOnInsert: { createdAt: new Date() },
        };
        await FacultyModel.findOneAndUpdate(
          { code: faculty.code },  
          facultyInstance,
          {upsert: true}
        ).exec();
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
        const faculty = await FacultyModel.findOne({code: major.facultyCode}).exec();
        if (!faculty) {
          throw new Error('No coresponding faculty found');
        }

        const majorInstance = {
          code: major.code,
          name: major.name,
          faculty,
          updatedAt: new Date(),
          $setOnInsert: { createdAt: new Date() }
        };
        await MajorModel.findOneAndUpdate(
          { code: major.code },
          majorInstance,
          {upsert: true}
        ).exec();
        majorCodes.push(major.code);
        log(`Major ${major.code} saved with name ${major.name}`);
      } catch (err) {
        log('Cannot save major result', major, err);
      }
    }
    return majorCodes;
  }

  private async saveStudent(student: Student): Promise<void> {
    const faculty = await FacultyModel.findOne({code: student.facultyCode}).exec();
    if (!faculty) {
      throw new Error('No coresponding faculty found');
    }

    let major: Document = undefined;
    if (student.majorCode !== undefined) {
      major = await MajorModel.findOne({code: student.majorCode}).exec();
      if (!major) {
        throw new Error('No coresponding major found');
      }
    }

    const studentInstance = {
      username: student.username,
      tpbNim: student.tpbNim,
      nim: student.nim,
      ai3Email: student.ai3Email,
      email: student.email,
      name: student.name,
      faculty,
      major,
      updatedAt: new Date(),
      $setOnInsert: { createdAt: new Date() }
    };
    await StudentModel.findOneAndUpdate(
      { tpbNim: student.tpbNim },
      studentInstance,
      {upsert: true}
    ).exec();
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
  constructor(username: string, password: string) {
    super(new NicCrawler(username, password));
  }
}