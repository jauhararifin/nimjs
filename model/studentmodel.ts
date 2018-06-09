

import { Schema, model } from 'mongoose';
import { facultySchema } from './facultymodel';
import { majorSchema } from './majormodel';

export const studentSchema = new Schema({

  username: {
    type: String,
    index: true,
    unique: true
  },

  tpbNim: {
    type: String,
    unique: true
  },

  nim: {
    type: String,
    index: true,
    unique: true
  },

  ai3Email: String,

  email: String,

  name: String,

  faculty: {
    type: Schema.Types.ObjectId,
    ref: facultySchema,
    index: true,
  },

  major: {
    type: Schema.Types.ObjectId,
    ref: majorSchema,
    index: true,
  },

  createdAt: { type: Date, default: Date.now },

  updatedAt: { type: Date, default: Date.now },

});

export const studentModel = model('crawler.student', studentSchema);
