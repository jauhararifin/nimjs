
import { Request, Response, Router } from 'express';
import { oneOf, body } from 'express-validator/check';
import { CrawlerService, NicCrawlerService } from './service';
import { 
  FacultyModel, MajorModel, StudentModel, LogModel,
  createFacultyModel, createMajorModel, createStudentModel, createLogModel,
} from '../model';

const MAJOR_ALL = '<all_major>';

const YEAR_ALL = -1;

export class CrawlerController {

  private crawlerService: CrawlerService;

  constructor(
    username: string, password: string,
    facultyModel: FacultyModel,
    majorModel: MajorModel,
    studentModel: StudentModel,
    logModel: LogModel
  );
  constructor(username: string, password: string);
  constructor(crawlerService: CrawlerService);
  constructor(
    first: CrawlerService | string,
    second?: string,
    third: FacultyModel = createFacultyModel(),
    forth: MajorModel = createMajorModel(),
    fifth: StudentModel = createStudentModel(),
    sixth: LogModel = createLogModel()
  ) {
    if (typeof first === 'string') {
      this.crawlerService = new NicCrawlerService(first, second, third, forth, fifth, sixth);
    } else {
      this.crawlerService = first;
    }

    this.crawl = this.crawl.bind(this);
  }

  async crawl(req: Request, res: Response) {
    const year = Number(req.body.year || YEAR_ALL);
    const major = (req.body.code || MAJOR_ALL).toString();

    res.json({
      'year': year === YEAR_ALL ? 'all year' : year,
      'major': major === MAJOR_ALL ? 'all majors' : major,
    });

    if (major !== MAJOR_ALL && year !== YEAR_ALL) {
      await this.crawlerService.crawlAllStudentsInMajorAndYear(major, year);
    } else if (major === MAJOR_ALL) {
      await this.crawlerService.crawlAllStudentsInYear(year);
    } else {
      await this.crawlerService.crawlAllStudentsInMajor(major);
    }
  }

  getRouter(): Router {
    const router = Router();
    router.post('/crawlers', oneOf([
      body('year').matches('[0-9]{4}'),
      body('code').matches('[0-9]{3}')
    ]), this.crawl);
    return router;
  }

}
