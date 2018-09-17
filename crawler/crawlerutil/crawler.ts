
import * as nicutil from '../nicutil';
import { majors } from './majors';

export interface Major {
  code: string;
  name: string;
}

export type Student = nicutil.Student;

export interface Crawler {

  crawlMajors(): AsyncIterableIterator<Major>;

  crawlStudents(major: string, year: number): AsyncIterableIterator<Student>;

}

const MAX_CONSECUTIVE_FAIL_THRESHOLD = 50;

const MAX_RETRY_UNTIL_FAILED = 5;

export class AbstractCrawler implements Crawler {

  constructor(private nic: nicutil.Nic) {
  }

  async *crawlMajors(): AsyncIterableIterator<Major> {
    for (const major of majors) {
      yield {...major};
    }
  }

  async *crawlStudents(major: string, year: number): AsyncIterableIterator<Student> {
    let consecutiveFails = 0;

    const yearStr = ("00" + year.toString()).slice(-2);
    const prefix = major + yearStr;
    const queue = Array.apply(null, {length: 700}).map((val,i) => {
      return {
        keyword: prefix + ("000" + (i+1).toString()).slice(-3),
        tried: 0,
      };
    });

    while (queue.length > 0) {
      if (consecutiveFails > MAX_CONSECUTIVE_FAIL_THRESHOLD) {
        break;
      }
      
      const { keyword, tried } = queue.shift();
      if (tried > MAX_RETRY_UNTIL_FAILED) {
        consecutiveFails++;
        continue;
      }
      
      try {
        yield await this.nic.checkStudent(keyword);
      } catch (e) {
        queue.push({keyword, tried: tried + 1});
      }
    }
  }

}

export class NicCrawler extends AbstractCrawler {
  constructor(username: string, password: string) {
    super(new nicutil.StandardNic(username, password));
  }
}