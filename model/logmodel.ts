

import { Schema, model } from 'mongoose';
import { facultySchema } from './facultymodel';
import { majorSchema } from './majormodel';
import { studentSchema } from './studentmodel';

export const logSchema = new Schema({

  issuedAt: { type: Date, default: Date.now },

  operation: {
    type: String,
    enum: ['insert', 'update', 'delete'],
  },

  type: {
    type: String,
    enum: ['faculty', 'major', 'student']
  },

  faculty: facultySchema,

  major: majorSchema,

  student: studentSchema,

});

export const logModel = model('crawler.log', logSchema);
