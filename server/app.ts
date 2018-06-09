import * as express from "express";
import * as bodyParser from "body-parser";
import * as dotenv from "dotenv";
import * as compression from 'compression';
import * as morgan from 'morgan';
import * as errorhandler from "errorhandler";

import * as crawler from '../crawler';

dotenv.config({ path: ".env.example" });

export const app = express();

// Express configuration
app.set('port', process.env.PORT || 3000);
app.set('env', process.env.ENV || 'development');
app.use(morgan('combined'));
app.use(compression());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(errorhandler());

if (process.env.AI3_ACCOUNT_USERNAME === undefined || process.env.AI3_ACCOUNT_PASSWORD === undefined) {
  console.log('missing ai3 account configuration in environment variables');
  process.exit();
}
app.use('/api/v1/crawlers', crawler.getRouter(process.env.AI3_ACCOUNT_USERNAME, process.env.AI3_ACCOUNT_PASSWORD));
