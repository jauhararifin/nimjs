
import { Router, Request, Response, NextFunction } from 'express';
import { Document, Types, Model } from 'mongoose';
import { majors } from '../crawler/crawlerutil/majors';
import { FacultyModel, MajorModel, createFacultyModel, createMajorModel } from '../model';
import { serialize as facultySerialize } from '../faculty';

export const serialize = (major:Document) => ({
  id: major.id,
  code: major.get('code'),
  name: major.get('name'),
  faculty: major.get('faculty') instanceof Model ? facultySerialize(major.get('faculty')) : major.get('faculty'),
});

export class MajorController {

  constructor(
    private facultyModel: FacultyModel = createFacultyModel(),
    private majorModel: MajorModel = createMajorModel()
  ) {
  }

  async findAll(req: Request, res: Response, next: NextFunction) {
    const majors = await this.majorModel.find().populate('faculty').exec();
    res.json(majors.map(serialize));
  }

  async findById(req: Request, res: Response) {
    let major = undefined;
    if (Types.ObjectId.isValid(req.params['id'] || '')) {
      major = await this.majorModel.findById(req.params['id'] || '').populate('faculty').exec();
      console.log(major);
    }
    if (major === null || major === undefined) {
      return res.status(404).json({'code': 400, 'message': 'not found'});
    }
    res.json(serialize(major));
  }

  async findAllByFaculty(req:Request, res: Response) {
    let faculty = undefined;
    if (Types.ObjectId.isValid(req.params['facultyId'] || '')) {
      faculty = await this.facultyModel.findById(req.params['facultyId'] || '').exec();
    }
    if (faculty === null || faculty === undefined) {
      return res.status(404).json({'code': 400, 'message': 'not found'});
    }
    const majors = await this.majorModel.find({faculty: faculty.id}).exec();
    majors.map(major => major.set('faculty', faculty));
    res.json(majors.map(serialize));
  }

  getRouter(): Router {
    const router = Router();
    router.get('/majors', this.findAll.bind(this));
    router.get('/majors/:id', this.findById.bind(this));
    router.get('/faculties/:facultyId/majors', this.findAllByFaculty.bind(this));
    return router;
  }

}
