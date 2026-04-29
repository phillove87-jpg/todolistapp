const validateRequest = (schema) => (req, res, next) => {
  const errors = [];

  if (schema.body) {
    for (const [field, rules] of Object.entries(schema.body)) {
      const value = req.body ? req.body[field] : undefined;

      if (rules.required && (value === undefined || value === null || value === '')) {
        errors.push(`${field}은(는) 필수 항목입니다`);
        continue;
      }

      if (value !== undefined && value !== null && value !== '') {
        if (rules.type === 'string' && typeof value !== 'string') {
          errors.push(`${field}은(는) 문자열이어야 합니다`);
        }
        if (rules.maxLength && typeof value === 'string' && value.length > rules.maxLength) {
          errors.push(`${field}은(는) ${rules.maxLength}자 이내여야 합니다`);
        }
        if (rules.minLength && typeof value === 'string' && value.length < rules.minLength) {
          errors.push(`${field}은(는) ${rules.minLength}자 이상이어야 합니다`);
        }
        if (rules.isEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errors.push(`${field}은(는) 올바른 이메일 형식이어야 합니다`);
        }
      }
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: errors[0],
      },
    });
  }

  next();
};

module.exports = validateRequest;
