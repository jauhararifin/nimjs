
import { Router, Request, Response } from 'express';
import { Document, Types, Model } from 'mongoose';
import { StudentModel, createStudentModel } from '../model';
import { serialize as majorSerialize } from '../major';

export const serialize = (student:Document) => ({
  id: student.id,
  username: student.get('username'),
  email: student.get('email'),
  ai3Email: student.get('ai3Email'),
  name: student.get('name'),
  majors: student.get('majors').map(majorSerialize),
});

export class StudentController {

  constructor(private studentModel: StudentModel = createStudentModel()) {
  }

  async findById(req: Request, res: Response) {
    let student = undefined;
    if (Types.ObjectId.isValid(req.params['id'] || '')) {
      student = await this.studentModel.findById(req.params['id'] || '').populate('majors').exec();
    }
    if (student === null || student === undefined) {
      return res.status(404).json({'code': 400, 'message': 'not found'});
    }
    res.json(serialize(student));
  }

  getRouter(): Router {
    const router = Router();
    router.get('/students/:id', this.findById.bind(this));
    return router;
  }

}
