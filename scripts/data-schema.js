/**
 * Declarative schema definitions for CV data files.
 *
 * Each schema is a plain object describing the expected shape.
 * The validate() function walks the schema and collects errors
 * without any external dependencies.
 *
 * Supported field descriptors:
 *   { type: 'string', required: true }
 *   { type: 'number', required: true, min: 1900 }
 *   { type: 'array',  required: true, minLength: 1, items: <schema> }
 *   { type: 'object', required: true, fields: { ... } }
 *   { type: 'url',    required: false }          — validates URL format
 *   { type: 'oneOf',  required: true, keys: ['a','b'] } — at least one key present
 */

const URL_PATTERN = /^https?:\/\/.+/i;
const EMAIL_PATTERN = /^mailto:[^\s@]+@[^\s@]+\.[^\s@]+$/i;
const PATH_PATTERN = /^\/[^\s]+$/;
const TEL_PATTERN = /^tel:/i;
const FRAGMENT_PATTERN = /^#/;

function isValidUrl(value) {
  if (typeof value !== 'string') return false;
  const v = value.trim();
  return (
    URL_PATTERN.test(v) ||
    EMAIL_PATTERN.test(v) ||
    PATH_PATTERN.test(v) ||
    TEL_PATTERN.test(v) ||
    FRAGMENT_PATTERN.test(v)
  );
}

/**
 * Validate `data` against `schema` and return an array of error strings.
 * @param {*} data
 * @param {object} schema - field descriptor or object with `fields`
 * @param {string} path   - dot-separated path for error messages
 * @returns {string[]}
 */
function validate(data, schema, path = '') {
  const errors = [];

  if (schema.type === 'oneOf') {
    const hasAny = schema.keys.some(
      k =>
        data != null &&
        data[k] != null &&
        (!Array.isArray(data[k]) || data[k].length)
    );
    if (!hasAny) {
      errors.push(
        `${path} must have at least one of: ${schema.keys.join(', ')}`
      );
    }
    return errors;
  }

  // Check required
  if (schema.required && (data == null || data === '')) {
    errors.push(`${path} is required`);
    return errors;
  }

  // If not required and absent, skip further checks
  if (data == null) return errors;

  switch (schema.type) {
    case 'string':
      if (typeof data !== 'string') {
        errors.push(`${path} must be a string`);
      }
      break;

    case 'number':
      if (typeof data !== 'number') {
        errors.push(`${path} must be a number`);
      } else if (schema.min != null && data < schema.min) {
        errors.push(`${path} must be >= ${schema.min}`);
      }
      break;

    case 'url':
      if (!isValidUrl(data)) {
        errors.push(`${path} has invalid URL: "${data}"`);
      }
      break;

    case 'array':
      if (!Array.isArray(data)) {
        errors.push(`${path} must be an array`);
      } else {
        if (schema.minLength && data.length < schema.minLength) {
          errors.push(`${path} must have at least ${schema.minLength} entry`);
        }
        if (schema.items) {
          data.forEach((item, i) => {
            errors.push(...validate(item, schema.items, `${path}[${i}]`));
          });
        }
      }
      break;

    case 'object':
      if (typeof data !== 'object' || Array.isArray(data)) {
        errors.push(`${path} must be an object`);
      } else if (schema.fields) {
        for (const [key, fieldSchema] of Object.entries(schema.fields)) {
          errors.push(
            ...validate(data[key], fieldSchema, path ? `${path}.${key}` : key)
          );
        }
      }
      break;
  }

  return errors;
}

// ─── Schema definitions ─────────────────────────────────────────────────────

const siteSchema = {
  type: 'object',
  required: true,
  fields: {
    baseUrl: { type: 'url', required: true },
    cvPdfPath: { type: 'string', required: true },
    careerStartYear: { type: 'number', required: true, min: 1900 },
  },
};

const sidebarSchema = {
  type: 'object',
  required: true,
  fields: {
    profile: {
      type: 'object',
      required: true,
      fields: {
        name: { type: 'string', required: true },
        title: { type: 'string', required: true },
        photo: {
          type: 'object',
          required: false,
          fields: {
            webp: { type: 'url', required: false },
            png: { type: 'url', required: false },
          },
        },
        location: {
          type: 'object',
          required: false,
          fields: {
            text: { type: 'string', required: false },
            city: { type: 'string', required: false },
            country: { type: 'string', required: false },
            url: { type: 'url', required: false },
          },
        },
      },
    },
    social: {
      type: 'array',
      required: false,
      items: {
        type: 'object',
        required: true,
        fields: {
          href: { type: 'url', required: true },
          label: { type: 'string', required: true },
          icon: { type: 'string', required: true },
        },
      },
    },
    languages: {
      type: 'array',
      required: false,
      items: {
        type: 'object',
        required: true,
        fields: {
          name: { type: 'string', required: true },
          level: { type: 'string', required: true },
          percent: { type: 'number', required: true },
          certUrl: { type: 'url', required: false },
        },
      },
    },
    nav: {
      type: 'array',
      required: true,
      minLength: 1,
      items: {
        type: 'object',
        required: true,
        fields: {
          href: { type: 'string', required: true },
          text: { type: 'string', required: true },
        },
      },
    },
  },
};

const aboutSchema = {
  type: 'object',
  required: true,
  fields: {
    paragraphs: { type: 'array', required: true, minLength: 1 },
    qualifications: { type: 'array', required: false },
  },
};

const positionSchema = {
  type: 'object',
  required: true,
  fields: {
    date: { type: 'string', required: true },
    title: { type: 'string', required: true },
  },
};

const experienceGroupSchema = {
  type: 'object',
  required: true,
  fields: {
    company: { type: 'string', required: true },
    date: { type: 'string', required: true },
    title: { type: 'string', required: true },
    positions: {
      type: 'array',
      required: true,
      minLength: 1,
      items: positionSchema,
    },
  },
};

const experienceSingleSchema = {
  type: 'object',
  required: true,
  fields: {
    company: { type: 'string', required: true },
    date: { type: 'string', required: true },
    title: { type: 'string', required: true },
  },
};

const experienceSchema = {
  type: 'oneOf',
  required: true,
  keys: ['groups', 'singles'],
};

const educationSchema = {
  type: 'oneOf',
  required: true,
  keys: ['groups', 'singles'],
};

const skillCategorySchema = {
  type: 'object',
  required: true,
  fields: {
    title: { type: 'string', required: true },
    icon: { type: 'string', required: true },
    color: { type: 'string', required: true },
    tags: { type: 'array', required: true, minLength: 1 },
  },
};

const skillsSchema = {
  type: 'array',
  required: true,
  minLength: 1,
  items: skillCategorySchema,
};

const certSchema = {
  type: 'object',
  required: true,
  fields: {
    title: { type: 'string', required: true },
    image: { type: 'url', required: true },
    href: { type: 'url', required: true },
  },
};

const certGroupSchema = {
  type: 'object',
  required: true,
  fields: {
    group: { type: 'string', required: true },
    certs: { type: 'array', required: true, minLength: 1, items: certSchema },
  },
};

const certificationsSchema = {
  type: 'array',
  required: true,
  minLength: 1,
  items: certGroupSchema,
};

/**
 * Top-level schema for the merged data object passed to templates.
 */
const dataSchema = {
  type: 'object',
  required: true,
  fields: {
    site: siteSchema,
    sidebar: sidebarSchema,
    about: aboutSchema,
    experience: experienceSchema,
    education: educationSchema,
    skills: skillsSchema,
    certifications: certificationsSchema,
  },
};

module.exports = { validate, dataSchema, isValidUrl };
