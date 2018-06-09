
import { Request, Response, Router } from 'express';
import { oneOf, body } from 'express-validator/check';
import { CrawlerService, NicCrawlerService } from './service';

const MAJOR_ALL = '<all_major>';

const YEAR_ALL = -1;

export function getCrawlerController(crawlerService: CrawlerService) {
  return async (req: Request, res: Response) => {
    const year = Number(req.body.year || YEAR_ALL);
    const major = (req.body.code || MAJOR_ALL).toString();

    res.json({
      'year': year === YEAR_ALL ? 'all year' : year,
      'major': major === MAJOR_ALL ? 'all majors' : major,
    });

    if (major !== MAJOR_ALL && year !== YEAR_ALL) {
      await crawlerService.crawlAllStudentsInMajorAndYear(major, year);
    } else if (major === MAJOR_ALL) {
      await crawlerService.crawlAllStudentsInYear(year);
    } else {
      await crawlerService.crawlAllStudentsInMajor(major);
    }
  };
}

export function getRouter(username: string, password: string): Router;
export function getRouter(crawlerService: CrawlerService): Router;
export function getRouter(first: CrawlerService | string, second?: string): Router {
  let crawlerService: CrawlerService;
  if (typeof first === 'string') {
    crawlerService = new NicCrawlerService(first, second);
  } else {
    crawlerService = first;
  }

  const router = Router();
  return router.post('/api/v1/crawlers', oneOf([
    body('year').matches('[0-9]{4}'),
    body('code').matches('[0-9]{3}')
  ]), getCrawlerController(crawlerService));
}
