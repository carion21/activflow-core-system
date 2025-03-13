import * as randomstring from 'randomstring';
import moment from 'moment';
import { Consts } from './constants';
import {
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import axios from 'axios';
// import * as slug from 'slug';
import slug from 'slug';
import { v4 as uuidv4 } from 'uuid';
import slugify from 'slugify';
import {
  isBoolean,
  isEmail,
  isInt,
  isNotEmpty,
  isNumber,
  isString,
  isUUID,
} from 'class-validator';
import { ConfigService } from '@nestjs/config';
import { User } from 'src/entities/user.entity';
const https = require('https');

const getSlug = (text: string) => {
  // with slug
  // return slug(text, {
  //   lower: true,
  //   locale: 'fr',
  // });

  // with slugify
  return slugify(text, {
    lower: true,
    locale: 'fr',
  });
};

const generateUuid = () => {
  return uuidv4();
};

const translate = (text: string) => {
  return text;
};

const generateNumberCodeSpecial = () => {
  return randomstring.generate({
    length: 4,
    charset: '1234567890',
  });
};

const generatePassword = (): string => {
  let password = '';

  do {
    password = randomstring.generate({
      length: 8,
      charset: 'alphanumeric', // Génère des lettres et des chiffres
    });
  } while (!/^(?=.*\d.*\d)(?!.*[^a-zA-Z0-9]).*$/.test(password)); // Vérifie les contraintes

  return password;
};

const isValidPassword = (password: string): boolean => {
  const minLength = 8;
  const regex = /^(?=.*\d.*\d)(?!.*[^a-zA-Z0-9]).*$/;

  return password.length >= minLength && regex.test(password);
};

const generateOtpCode = () => {
  return randomstring.generate({
    length: 6,
    charset: '1234567890',
  });
};

const generateCode = (keyword: string) => {
  let now = moment();
  let suffix =
    now.format('YYYYMMDDHH_mmss').substring(2) +
    '_' +
    generateNumberCodeSpecial();
  return keyword + '' + suffix;
};

const genProfileCode = () => {
  return generateCode('PRF');
};

const genUserCode = () => {
  return generateCode('USR');
};

const genTeamCode = () => {
  return generateCode('TEM');
};

const genActivityCode = () => {
  return generateCode('ACT');
};

const genKpiCode = () => {
  return generateCode('KPI');
};

const genFormCode = () => {
  return generateCode('FRM');
};

const genFieldTypeCode = () => {
  return generateCode('FTY');
};

const genFieldCode = () => {
  return generateCode('FLD');
};

const genAreaCode = () => {
  return generateCode('ARE');
};

const genReportCode = () => {
  return generateCode('RPT');
}

const getUiAvatar = (user: Object) => {
  const configService = new ConfigService();
  let uname = user['firstname'] + ' ' + user['lastname'];
  // get all words and concatenate with +
  uname = uname.replace(/\s/g, '+');
  return (
    // configService.get('UI_AVATAR_URL') + uname + '&background=ff8000&color=fff'
    configService.get('UI_AVATAR_URL') + uname + '&background=2C3E50&color=fff'
  );
};

const applyRbac = (userAuthenticated: object, permission: string) => {
  if (
    Consts.ROLES[userAuthenticated['profile']['value']].indexOf(permission) ===
    -1
  ) {
    throw new UnauthorizedException(Consts.MSG_UNAUTHORIZED);
  }
};

const controlData = (inputs: object) => {
  const result = {
    success: true,
    message: 'Data is valid',
  };

  let error = '';

  try {
    const mapSelectValues = inputs['mapSelectValues'];
    const mapFieldTypes = inputs['mapFieldTypes'];
    const allFields = inputs['allFields'];
    const requiredFields = inputs['requiredFields'];
    const data = inputs['data'];
    const dataKeys = Object.keys(data);

    // check if all required fields are present
    const missingFields = requiredFields.filter(
      (field: string) => !dataKeys.includes(field),
    );
    if (missingFields.length > 0) {
      error = `Missing required fields: ${missingFields.join(', ')}`;
    }

    const presentFields = allFields.filter((field: string) =>
      dataKeys.includes(field),
    );

    // const unknownFields = dataKeys.filter((field: string) => !allFields.includes(field));

    // check if the field type is correct
    presentFields.forEach((field: string) => {
      const field_type = mapFieldTypes[field];
      const field_value = data[field];
      const control =
        field_type == 'select' || field_type == 'checkbox'
          ? controlFieldType(
              field,
              field_value,
              field_type,
              mapSelectValues[field],
            )
          : controlFieldType(field, field_value, field_type);

      // const control = field_type ==  controlFieldType(field, field_value, field_type);
      if (!control.success) {
        error = control.message;
      }
    });
  } catch (err) {
    error = err;
  }

  if (error) {
    result.success = false;
    result.message = error;
  }

  return result;
};

const controlFieldType = (
  field: string,
  value: any,
  field_type: string,
  select_values: string[] = [],
) => {
  let result = {
    success: false,
    message: 'The field is valid',
  };

  let error = '';

  switch (field_type) {
    case 'simple-text':
      if (isString(value) && isNotEmpty(value) && value.length <= 255) {
        result.success = true;
      } else {
        error = 'the field ' + field + ' must be a simple text and not empty';
      }
      break;
    case 'long-text':
      if (isString(value) && isNotEmpty(value)) {
        result.success = true;
      } else {
        error = 'the field ' + field + ' must be a long text and not empty';
      }
      break;
    case 'email':
      if (isEmail(value)) {
        result.success = true;
      } else {
        error = 'the field ' + field + ' must be an email';
      }
      break;
    case 'uuid':
      if (isUUID(value)) {
        result.success = true;
      }
      if (!result.success) {
        error = 'the field ' + field + ' must be a uuid';
      }
      break;
    case 'date':
      if (isString(value) && isNotEmpty(value)) {
        if (moment(value, 'YYYY-MM-DD').isValid()) {
          result.success = true;
        }
      }
      if (!result.success) {
        error = 'the field ' + field + ' must be a string date';
      }
      break;
    case 'time':
      if (isString(value) && isNotEmpty(value)) {
        if (moment(value, 'HH:mm:ss').isValid()) {
          result.success = true;
        }
      }
      if (!result.success) {
        error = 'the field ' + field + ' must be a string time';
      }
      break;
    case 'datetime':
      if (isString(value) && isNotEmpty(value)) {
        if (moment(value, 'YYYY-MM-DD HH:mm:ss').isValid()) {
          result.success = true;
        }
      }
      if (!result.success) {
        error = 'the field ' + field + ' must be a string datetime';
      }
      break;
    case 'boolean':
      if (isBoolean(value)) {
        result.success = true;
      }
      if (!result.success) {
        error = 'the field ' + field + ' must be a boolean';
      }
      break;
    case 'integer':
      if (isInt(value)) {
        result.success = true;
      }
      if (!result.success) {
        error = 'the field ' + field + ' must be a integer';
      }
      break;
    case 'number':
      if (isNumber(value)) {
        result.success = true;
      }
      if (!result.success) {
        error = 'the field ' + field + ' must be a number';
      }
      break;
    case 'float':
      if (isNumber(value)) {
        result.success = true;
      }
      if (!result.success) {
        error = 'the field ' + field + ' must be a float';
      }
      break;
    case 'select':
      if (
        isString(value) &&
        isNotEmpty(value) &&
        select_values.includes(value)
      ) {
        result.success = true;
      }
      if (!result.success) {
        error =
          'the field ' +
          field +
          ' must be a string between +=> ' +
          select_values.join(', ');
      }
      break;
    case 'checkbox':
      if (Array.isArray(value) && value.length > 0) {
        const invalidValues = value.filter((v) => !select_values.includes(v));
        if (invalidValues.length === 0) {
          result.success = true;
        }
      }
      if (!result.success) {
        error =
          'the field ' +
          field +
          ' must be an array of strings between +=> ' +
          select_values.join(', ');
      }
      break;
    case 'file':
      if (
        isString(value) &&
        isNotEmpty(value) &&
        Consts.FILE_EXTENSIONS_ALLOWED.includes(value.split('.').pop())
      ) {
        result.success = true;
      }
      if (!result.success) {
        error =
          'the field ' +
          field +
          ' must be a file and extensions allowed are ' +
          Consts.FILE_EXTENSIONS_ALLOWED.join(', ');
      }
      break;
    case 'location':
      if (
        isString(value) &&
        isNotEmpty(value) &&
        value.split(',').length === 2
      ) {
        result.success = true;
      }
      if (!result.success) {
        error = 'the field ' + field + ' must be a location';
      }
      break;
    case 'image':
      if (
        isString(value) &&
        isNotEmpty(value) &&
        Consts.IMAGE_EXTENSIONS_ALLOWED.includes(value.split('.').pop())
      ) {
        result.success = true;
      }
      if (!result.success) {
        error =
          'the field ' +
          field +
          ' must be an image and extensions allowed are ' +
          Consts.IMAGE_EXTENSIONS_ALLOWED.join(', ');
      }
      break;
    case 'multi-image':
      if (Array.isArray(value) && value.length > 0) {
        const invalidValues = value.filter(
          (v) => !Consts.IMAGE_EXTENSIONS_ALLOWED.includes(v.split('.').pop()),
        );
        if (invalidValues.length === 0) {
          result.success = true;
        }
      }
      if (!result.success) {
        error =
          'the field ' +
          field +
          ' must be an array of images and extensions allowed are ' +
          Consts.IMAGE_EXTENSIONS_ALLOWED.join(', ');
      }
      break;
    default:
      error = 'the field ' + field + ' has an unknown type';
      break;
  }

  if (error != '') {
    result.message = error;
  }

  return result;
};

function sumListKpiValues(listOfkpiValues: object[]): object {
  try {
    return listOfkpiValues.reduce((sum, kpiValues) => {
      for (const [cle, valeur] of Object.entries(kpiValues)) {
        sum[cle] = (sum[cle] || 0) + valeur;
      }
      return sum;
    }, {});
  } catch (err) {
    return {};
  }
}

const generateDatesBetween = (start, end) => {
  const startDate = moment(start);
  const endDate = moment(end);
  const dates = [];

  while (startDate.isSameOrBefore(endDate)) {
    dates.push(startDate.format('YYYY-MM-DD'));
    startDate.add(1, 'day');
  }

  return dates;
};

const coreMakePostRequest = async ({
  baseUrl,
  endpoint,
  data,
  isProtected = false,
  jwtToken = '',
  additionalHeaders = {},
  pfx = null, // Option pour le certificat PFX
  passphrase = '', // Option pour le mot de passe du certificat
}) => {
  let result = {
    success: false,
    statusCode: 0,
    message: '',
    data: null,
  };

  let error = '';

  let urlComplete = baseUrl + endpoint;
  console.log('urlComplete', urlComplete);

  try {
    // Définir les en-têtes de la requête en ajoutant des en-têtes supplémentaires si disponibles
    const headers = {
      'Content-Type': 'application/json', // Par défaut, envoi des données en JSON
      ...(isProtected && { Authorization: 'Bearer ' + jwtToken }),
      ...additionalHeaders, // Fusionne les en-têtes supplémentaires
    };

    // Configurer l'agent HTTPS si un certificat PFX est fourni
    const httpsAgent = pfx
      ? new https.Agent({
          pfx: pfx, // Fichier de certificat PFX en buffer
          passphrase: passphrase, // Mot de passe pour le certificat
          rejectUnauthorized: false, // Accepter les certificats auto-signés
        })
      : undefined;

    // Faire la requête POST avec les données, les en-têtes, et l'agent HTTPS si nécessaire
    let response = await axios.post(urlComplete, data, {
      headers: headers,
      httpsAgent: httpsAgent, // Agent pour utiliser le certificat, si disponible
    });

    // Vérifier la réponse
    if (
      response.status === 200 ||
      response.status === 201 ||
      response.status === 202 ||
      response.status === 204
    ) {
      result.statusCode = response.status;
      let rData = response.data;
      result.success = true;
      result.data = rData.data ?? rData;
    } else {
      result.statusCode = response.status;
      error = response.data.message;
    }
  } catch (err) {
    result.statusCode = err.response.status;
    error = err.message;
    if (err.response) {
      console.log('Status Code:', err.response.status);
      console.log('Headers:', err.response.headers);
      console.log('Data:', err.response.data);
      result.data = err.response.data;
      error = err.response.data.message;
    }
  }

  // Si une erreur est survenue, mettre à jour le message de résultat
  if (error !== '') {
    result.message = error;
  }

  return result;
};

const listmonkSendEmail = async (
  user: User,
  templateId: number,
  emailData: object,
) => {
  let result = {
    success: false,
    message: '',
    data: null,
  };
  try {
    const configService = new ConfigService();
    const baseUrl = configService.get('LISTMONK_API_URL');
    const listId = configService.get('LISTMONK_SUBSCRIBER_LIST_ID');
    const username = configService.get('LISTMONK_API_USERNAME');
    const password = configService.get('LISTMONK_API_PASSWORD');
    const basicToken = Buffer.from(`${username}:${password}`).toString(
      'base64',
    );
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Basic ${basicToken}`,
    };
    // create the subscriber if not exists
    const rListmonkSubscriber = await coreMakePostRequest({
      baseUrl,
      endpoint: '/subscribers',
      data: {
        email: user.email,
        name: `${user.firstname.toUpperCase()} ${user.lastname.toUpperCase()}`,
        status: 'enabled',
        lists: [+listId],
      },
      additionalHeaders: headers,
    });
    if (rListmonkSubscriber.success) {
      console.log('Subscriber created successfully');
    } else if (
      !rListmonkSubscriber.success &&
      rListmonkSubscriber.statusCode === 409
    ) {
      console.log('Subscriber already exists');
    } else {
      console.log('Subscriber creation failed');
    }
    // send the email
    const rListmonkEmail = await coreMakePostRequest({
      baseUrl,
      endpoint: '/tx',
      data: {
        subscriber_email: user.email,
        template_id: templateId,
        data: emailData,
        content_type: 'html',
      },
      additionalHeaders: headers,
    });
    if (rListmonkEmail.success) {
      result.success = true;
      result.data = rListmonkEmail.data;
      console.log('Email sent successfully');
    } else {
      result.message = `Erreur lors de l'envoi de l'email via Listmonk: ${rListmonkEmail.message}`;
    }
  } catch (err) {
    console.error('Erreur Listmonk:', err.message);
    result.message = `Erreur lors de l'envoi de l'email via Listmonk: ${err.message}`;
  }
  return result;
};

export {
  getSlug,
  generateUuid,
  translate,
  generateOtpCode,
  generatePassword,
  isValidPassword,
  genProfileCode,
  genUserCode,
  genTeamCode,
  genActivityCode,
  genKpiCode,
  genFormCode,
  genFieldTypeCode,
  genFieldCode,
  genAreaCode,
  genReportCode,
  getUiAvatar,
  applyRbac,
  controlData,
  controlFieldType,
  sumListKpiValues,
  generateDatesBetween,
  listmonkSendEmail,
};
