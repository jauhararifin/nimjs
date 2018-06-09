
import { Schema, model } from 'mongoose';

export const facultySchema = new Schema({

  code: {
    type: String,
    index: true,
    unique: true
  },

  name: String,

  createdAt: { type: Date, default: Date.now },

  updatedAt: { type: Date, default: Date.now},

});

export const facultyModel = model('crawler.faculty', facultySchema);
