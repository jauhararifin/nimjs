import { Crawler, NicCrawler } from "./crawlerutil";
import { facultyModel } from "./facultymodel";

export interface CrawlerService {

  crawlAllStundentsInYear(year: number): Promise<void>;

  crawlAllStudentsInMajor(majorCode: string): Promise<void>;

  crawlAllStudentsInMajorAndYear(majorCode: string, year: number): Promise<void>;

}

export class StandardCrawlerService implements CrawlerService {
  
  private crawler: Crawler;

  constructor(private crawlerUtil: Crawler) {
  }

  async crawlAllFaculties(): Promise<void> {
    for await (const faculty of this.crawler.crawlFaculties()) {
      const facultyInstance = {
        code: faculty.code,
        name: faculty.name,
      };
      await facultyModel.findOneAndUpdate(
        facultyInstance, 
        { code: faculty.code }, 
        {upsert: true}
      ).exec();
    }
  }

  async crawlAllMajors(): Promise<void> {
  }

  async crawlAllStundentsInYear(year: number): Promise<void> {
    throw new Error("Method not implemented.");
  }

  async crawlAllStudentsInMajor(majorCode: string): Promise<void> {
    throw new Error("Method not implemented.");
  }

  async crawlAllStudentsInMajorAndYear(majorCode: string, year: number): Promise<void> {
    throw new Error("Method not implemented.");
  }

}

export class NicCrawlerService extends StandardCrawlerService {
  constructor(username: string, password: string) {
    super(new NicCrawler(username, password));
  }
}