
import { Router, Request, Response } from 'express';
import { Document, Types } from 'mongoose';
import { StudentModel } from '../model';

export const serialize = (student:Document) => ({
  id: student.id,
  username: student.get('username'),
  email: student.get('email'),
  ai3Email: student.get('ai3Email'),
  tpbNim: student.get('tpbNim'),
  nim: student.get('nim'),
  name: student.get('name'),
  faculty: student.get('faculty'),
  major: student.get('major'),
});

export class StudentController {

  constructor(private studentModel: StudentModel) {
  }

  async findById(req: Request, res: Response) {
    let student = undefined;
    if (Types.ObjectId.isValid(req.params['id'] || '')) {
      student = await this.studentModel.findById(req.params['id'] || '').exec();
    }
    if (student === null || student === undefined) {
      return res.status(404).json({'error': 'not found'});
    }
    res.json(serialize(student));
  }

  getRouter(): Router {
    const router = Router();
    router.get('/students/:id', this.findById);
    const getRouter = () => router;
    return router;
  }

}
