

import { Schema, model } from 'mongoose';
import { facultySchema } from './facultymodel';

export const majorSchema = new Schema({

  code: {
    type: String,
    index: true,
    unique: true
  },

  name: String,

  faculty: {
    type: Schema.Types.ObjectId,
    ref: facultySchema,
    index: true,
  },

  createdAt: { type: Date, default: Date.now },

});

export const majorModel = model('CrawlerFaculty', majorSchema);
