import { query } from 'express-validator/check';

import { SearcherService, CachedSearcherService } from '.';
import { Request, Response, Router } from 'express';
import { serialize as majorSerialize } from '../major';
import { serialize as studentSerialize } from '../student';

export class SearcherController {

  constructor(private searcherService: SearcherService = new CachedSearcherService()) {
  }

  private async genericSearch(req: Request, res: Response, searchMethod, searializer) {
    const keyword = req.query['keyword'] || '';
    const page = Number.parseInt(req.query['page'] || '1');
    const count = Number.parseInt(req.query['count'] || '30');

    const results = await searchMethod(keyword);
    
    const totalCount = results.length;
    const pageCount = Math.min(count, totalCount);
    const totalPage = Math.max(1, Math.ceil(totalCount / pageCount));

    if (page > totalPage) {
      res.status(404).json({'code': 400, 'message': 'not found'});
    } else {
      const payload = results.length > 0 ? results.slice((page - 1) * count, page * count).map(searializer) : [];
      res.status(200).json({
        pagination: {
          page,
          totalPage,
          pageCount,
          totalCount,
        },
        payload
      });
    }

  }

  private async searchMajor(req: Request, res: Response) {
    this.genericSearch(req, res, this.searcherService.searchMajor.bind(this.searcherService), majorSerialize);
  }

  private async searchStudent(req: Request, res: Response) {
    this.genericSearch(req, res, this.searcherService.searchStudent.bind(this.searcherService), studentSerialize);
  }

  getRouter(): Router {
    const router = Router();

    const filter = [
      query('count').optional().isInt({gt: 0, lt: 301,}), 
      query('page').optional().isInt({gt: 0,}),
      query('keyword').isString(),
    ];

    router.get('/searchers/majors', filter, this.searchMajor.bind(this));
    router.get('/searchers/students', filter, this.searchStudent.bind(this));
    
    return router;
  }

}

export { SearcherService, CachedSearcherService } from './service';