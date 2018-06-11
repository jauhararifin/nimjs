
import { Router, Request, Response } from 'express';
import { Document, Types } from 'mongoose';

import { FacultyModel } from '../model';
import { faculties } from '../crawler/crawlerutil/faculties';

export const serialize = (faculty:Document) => ({
  id: faculty.id,
  code: faculty.get('code'),
  name: faculty.get('name'),
});

export class FacultyController {

  constructor(private facultyModel: FacultyModel) {
  }

  async findAll(req: Request, res: Response) {
    const faculties = await this.facultyModel.find().exec();
    res.json(faculties.map(serialize));
  }
  
  async findById(req: Request, res: Response) {
    let faculty = undefined;
    if (Types.ObjectId.isValid(req.params['id'] || '')) {
      faculty = await this.facultyModel.findById(req.params['id'] || '').exec();
    }
    if (faculty === null || faculty === undefined) {
      return res.status(404).json({'error': 'not found'});
    }
    res.json(serialize(faculty));
  }

  getRouter(): Router {
    const router = Router();
    router.get('/faculties', this.findAll);
    router.get('/faculties/:id', this.findById);
    return router;
  }

}
