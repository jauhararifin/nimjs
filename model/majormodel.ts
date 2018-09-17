

import { Schema, Connection, Model, Document, connection } from 'mongoose';

export const majorSchema = new Schema({

  code: {
    type: String,
    index: true,
    unique: true
  },

  name: String,

  createdAt: { type: Date, default: Date.now },

  updatedAt: { type: Date, default: Date.now },

});

export interface MajorModel extends Model<Document> {
}

export const createModel = (conn: Connection = connection): MajorModel => conn.model('crawler.major', majorSchema);
