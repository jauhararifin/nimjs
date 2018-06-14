
import { Router, Request, Response } from 'express';
import { Document, Types } from 'mongoose';

import { FacultyModel, createFacultyModel, StudentModel, createStudentModel, MajorModel, createMajorModel } from '../model';
import { faculties } from '../crawler/crawlerutil/faculties';

export const serialize = (faculty:Document) => ({
  id: faculty.id,
  code: faculty.get('code'),
  name: faculty.get('name'),
});

export class FacultyController {

  constructor(
    private facultyModel: FacultyModel = createFacultyModel(),
    private majorModel: MajorModel = createMajorModel(),
    private studentModel: StudentModel = createStudentModel(),
  ) {
    this.findAll = this.findAll.bind(this);
    this.findById = this.findById.bind(this);
    this.findByMajor = this.findByMajor.bind(this);
    this.findByStudent = this.findByStudent.bind(this);
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
      return res.status(404).json({'code': 400, 'message': 'not found'});
    }
    res.json(serialize(faculty));
  }

  async findByMajor(req: Request, res: Response) {
    let major = undefined;
    if (Types.ObjectId.isValid(req.params['majorId'] || '')) {
      major = await this.majorModel.findById(req.params['majorId'] || '').populate('faculty').exec();
    }
    if (major === null || major === undefined || major.faculty === null || major.faculty === undefined) {
      return res.status(404).json({'code': 400, 'message': 'not found'});
    }
    res.json(serialize(major.faculty));
  }

  async findByStudent(req: Request, res: Response) {
    let student = undefined;
    if (Types.ObjectId.isValid(req.params['studentId'] || '')) {
      student = await this.studentModel.findById(req.params['studentId'] || '').populate('faculty').exec();
    }
    if (student === null || student === undefined || student.faculty === null || student.faculty === undefined) {
      return res.status(404).json({'code': 400, 'message': 'not found'});
    }
    res.json(serialize(student.faculty));
  }

  getRouter(): Router {
    const router = Router();
    router.get('/faculties', this.findAll.bind(this));
    router.get('/faculties/:id', this.findById.bind(this));
    router.get('/students/:studentId/faculty', this.findByStudent.bind(this));
    router.get('/majors/:majorId/faculty', this.findByMajor.bind(this));
    return router;
  }

}
