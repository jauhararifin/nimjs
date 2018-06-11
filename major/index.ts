
import { Router, Request, Response, NextFunction } from 'express';
import { Document, Types } from 'mongoose';
import { majors } from '../crawler/crawlerutil/majors';
import { FacultyModel, MajorModel } from '../model';

export const serialize = (major:Document) => ({
  id: major.id,
  code: major.get('code'),
  name: major.get('name'),
  faculty: major.get('faculty'),
});

export class MajorController {

  constructor(private facultyModel: FacultyModel, private majorModel: MajorModel) {
  }

  async findAll(req: Request, res: Response, next: NextFunction) {
    const majors = await this.majorModel.find().exec();
    res.json(majors.map(serialize));
  }

  async findById(req: Request, res: Response) {
    let major = undefined;
    if (Types.ObjectId.isValid(req.params['id'] || '')) {
      major = await this.majorModel.findById(req.params['id'] || '').exec();
    }
    if (major === null || major === undefined) {
      return res.status(404).json({'error': 'not found'});
    }
    res.json(serialize(major));
  }

  async findAllByFaculty(req:Request, res: Response) {
    let faculty = undefined;
    if (Types.ObjectId.isValid(req.params['facultyId'] || '')) {
      faculty = await this.facultyModel.findById(req.params['facultyId'] || '').exec();
    }
    if (faculty === null || faculty === undefined) {
      return res.status(404).json({'error': 'not found'});
    }
    const majors = await this.majorModel.find({faculty: faculty.id}).exec();
    res.json(majors.map(serialize));
  }

  getRouter(): Router {
    const router = Router();
    router.get('/majors', this.findAll);
    router.get('/majors/:id', this.findById);
    router.get('/faculties/:facultyId/majors', this.findAllByFaculty);
    return router;
  }

}
