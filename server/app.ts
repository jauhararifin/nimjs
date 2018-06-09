import * as express from "express";
import * as bodyParser from "body-parser";
import * as dotenv from "dotenv";
import * as compression from 'compression';
import * as morgan from 'morgan';
import * as errorhandler from "errorhandler";

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
