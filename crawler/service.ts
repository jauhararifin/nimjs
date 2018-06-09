import { Crawler, NicCrawler } from "./crawlerutil";
import { facultyModel } from "./facultymodel";

export interface CrawlerService {

  crawlAllStudentsInYear(year: number): Promise<void>;

  crawlAllStudentsInMajor(majorCode: string): Promise<void>;

  crawlAllStudentsInMajorAndYear(majorCode: string, year: number): Promise<void>;

}

export class StandardCrawlerService implements CrawlerService {

  constructor(private crawler: Crawler) {
  }

  async crawlAllFaculties(): Promise<string[]> {
    const facultiesResult: string[] = [];
    console.log(this.crawler.crawlFaculties());
    for await (const faculty of this.crawler.crawlFaculties()) {
      facultiesResult.push(faculty.code);
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
    return facultiesResult;
  }

  async crawlAllMajors(): Promise<void> {
  }

  async crawlAllStudentsInYear(year: number): Promise<void> {
    await this.crawlAllFaculties();
  }

  async crawlAllStudentsInMajor(majorCode: string): Promise<void> {
    await this.crawlAllFaculties();
  }

  async crawlAllStudentsInMajorAndYear(majorCode: string, year: number): Promise<void> {
    await this.crawlAllFaculties();
  }

}

export class NicCrawlerService extends StandardCrawlerService {
  constructor(username: string, password: string) {
    super(new NicCrawler(username, password));
  }
}