import { Crawler, NicCrawler, Student } from './crawlerutil';
import { facultyModel } from './facultymodel';
import { majorModel } from './majormodel';
import { studentModel } from './studentmodel';
import { Document } from 'mongoose';

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
        };
        await facultyModel.findOneAndUpdate(
          facultyInstance, 
          { code: faculty.code, $setOnInsert: { createdAt: new Date() } }, 
          {upsert: true}
        ).exec();
        facultyCodes.push(faculty.code);
      } catch (err) {
        console.log('cannot save faculty result', faculty, err);
      }
    }
    return facultyCodes;
  }

  private async crawlAllMajors(): Promise<string[]> {
    const majorCodes: string[] = [];
    for await (const major of this.crawler.crawlMajors()) {
      try {
        const faculty = await facultyModel.findOne({code: major.facultyCode}).exec();
        if (!faculty) {
          throw new Error('No coresponding faculty found');
        }

        const majorInstance = {
          code: major.code,
          name: major.name,
          faculty,
          updatedAt: new Date(),
        };
        await majorModel.findOneAndUpdate(
          majorInstance, 
          { code: major.code, $setOnInsert: { createdAt: new Date() } }, 
          {upsert: true}
        ).exec();
        majorCodes.push(major.code);
      } catch (err) {
        console.log('cannot save major resul', major, err);
      }
    }
    return majorCodes;
  }

  private async saveStudent(student: Student): Promise<void> {
    const faculty = await facultyModel.findOne({code: student.facultyCode}).exec();
    if (!faculty) {
      throw new Error('No coresponding faculty found');
    }

    let major: Document = undefined;
    if (student.majorCode !== undefined) {
      major = await majorModel.findOne({code: student.majorCode}).exec();
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
    };
    await studentModel.findOneAndUpdate(
      studentInstance, 
      { tpbNim: student.tpbNim, $setOnInsert: { createdAt: new Date() } }, 
      {upsert: true}
    ).exec();
  }

  private async crawlStudentIterator(students: Array<AsyncIterableIterator<Student>>): Promise<void> {
    students.forEach(async studentIterator => {
      for await (const student of studentIterator) {
        try {
          this.saveStudent(student);
        } catch (err) {
          console.log('Cannot save student', student, err);
        }
      }
    });
  }

  async crawlAllStudentsInYear(year: number): Promise<void> {
    const faculties = await this.crawlAllFaculties();
    const majors = await this.crawlAllMajors();

    const iterators = faculties.map(majorCode => this.crawler.crawlStudents(majorCode, new Date().getFullYear()));
    this.crawlStudentIterator(iterators);
  }

  async crawlAllStudentsInMajor(majorCode: string): Promise<void> {
    const faculties = await this.crawlAllFaculties();
    const majors = await this.crawlAllMajors();

    const years = [];
    for (let year = 2012; year <= new Date().getFullYear(); year++) {
      years.push(year);
    }

    const iterators = years.map(year => this.crawler.crawlStudents(majorCode, year));
    this.crawlStudentIterator(iterators);
  }

  async crawlAllStudentsInMajorAndYear(majorCode: string, year: number): Promise<void> {
    const faculties = await this.crawlAllFaculties();
    const majors = await this.crawlAllMajors();

    this.crawlStudentIterator([this.crawler.crawlStudents(majorCode, year)]);
  }

}

export class NicCrawlerService extends StandardCrawlerService {
  constructor(username: string, password: string) {
    super(new NicCrawler(username, password));
  }
}