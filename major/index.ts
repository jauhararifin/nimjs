
import { Router, Request, Response, NextFunction } from 'express';
import { Document, Types, Model } from 'mongoose';
import { MajorModel, StudentModel, createMajorModel, createStudentModel } from '../model';

export const serialize = (major:Document) => ({
  id: major.id,
  code: major.get('code'),
  name: major.get('name'),
});

export class MajorController {

  constructor(
    private majorModel: MajorModel = createMajorModel(),
    private studentModel: StudentModel = createStudentModel(),
  ) {
    this.findAll = this.findAll.bind(this);
    this.findById = this.findById.bind(this);
    this.findByStudent = this.findByStudent.bind(this);
  }

  async findAll(req: Request, res: Response, next: NextFunction) {
    const majors = await this.majorModel.find();
    res.json(majors.map(serialize));
  }

  async findById(req: Request, res: Response) {
    let major = undefined;
    if (Types.ObjectId.isValid(req.params['id'] || '')) {
      major = await this.majorModel.findById(req.params['id'] || '').exec();
    }
    if (major === null || major === undefined) {
      return res.status(404).json({'code': 400, 'message': 'not found'});
    }
    res.json(serialize(major));
  }

  async findByStudent(req: Request, res: Response) {
    let student = undefined;
    if (Types.ObjectId.isValid(req.params['studentId'] || '')) {
      student = await this.studentModel.findById(req.params['studentId'] || '').populate('majors').exec();
    }
    if (student === null || student === undefined || student.major === null || student.major === undefined) {
      return res.status(404).json({'code': 400, 'message': 'not found'});
    }
    res.json(student.majors.map(serialize));
  }

  getRouter(): Router {
    const router = Router();
    router.get('/majors', this.findAll.bind(this));
    router.get('/majors/:id', this.findById.bind(this));
    router.get('/students/:studentId/major', this.findByStudent.bind(this));
    return router;
  }

}
