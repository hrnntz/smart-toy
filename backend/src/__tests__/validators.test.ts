import {
  generateStorySchema,
  rutinaSchema,
  updateRutinaSchema,
  registerSchema,
  loginSchema,
  childSchema,
  updateDeviceConfigSchema,
  updatePushTokenSchema,
} from '../validators';

describe('Validation Schemas Unit Tests', () => {
  describe('Story Generator Schema (generateStorySchema)', () => {
    it('should accept duration as a string (from mobile dropdown like "Media (10 min)")', () => {
      const payload = {
        body: {
          tema: 'Aventura espacial',
          duracion: 'Media (10 min)',
          personajes: 'Panda y Robot',
          enseñanza: 'Amistad y trabajo en equipo',
        },
      };
      const result = generateStorySchema.safeParse(payload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.body.duracion).toBe('Media (10 min)');
      }
    });

    it('should accept duration as an integer number', () => {
      const payload = {
        body: {
          tema: 'Dinosaurios',
          duracion: 10,
        },
      };
      const result = generateStorySchema.safeParse(payload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.body.duracion).toBe(10);
      }
    });

    it('should reject when required tema is missing', () => {
      const payload = {
        body: {
          duracion: 10,
        },
      };
      const result = generateStorySchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it('should reject duration exceeding max length or bounds', () => {
      const payloadLong = {
        body: {
          tema: 'Espacio',
          duracion: 'x'.repeat(60), // max is 50
        },
      };
      const payloadBigNum = {
        body: {
          tema: 'Espacio',
          duracion: 999, // max is 60
        },
      };
      expect(generateStorySchema.safeParse(payloadLong).success).toBe(false);
      expect(generateStorySchema.safeParse(payloadBigNum).success).toBe(false);
    });
  });

  describe('Rutina Schemas (rutinaSchema & updateRutinaSchema)', () => {
    it('should validate complete rutina creation schema', () => {
      const validRutina = {
        body: {
          nombre: 'Cepillarse los dientes',
          hora: '20:30',
          repetir: true,
          mensaje: '¡A cepillarse!',
          accionAdicional: 'parpadeo_verde',
          isActive: true,
        },
      };
      const result = rutinaSchema.safeParse(validRutina);
      expect(result.success).toBe(true);
    });

    it('should reject invalid hour format in rutinaSchema', () => {
      const invalidRutina = {
        body: {
          nombre: 'Dormir',
          hora: '25:00', // out of range hour
        },
      };
      const result = rutinaSchema.safeParse(invalidRutina);
      expect(result.success).toBe(false);
    });

    it('should allow partial updates in updateRutinaSchema (e.g. toggling isActive)', () => {
      const togglePayload = {
        body: {
          isActive: false,
        },
      };
      const result = updateRutinaSchema.safeParse(togglePayload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.body.isActive).toBe(false);
      }
    });

    it('should allow updating only hora in updateRutinaSchema', () => {
      const hourUpdate = {
        body: {
          hora: '07:15',
        },
      };
      const result = updateRutinaSchema.safeParse(hourUpdate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.body.hora).toBe('07:15');
      }
    });

    it('should reject invalid hour in updateRutinaSchema', () => {
      const invalidHour = {
        body: {
          hora: '25:00',
        },
      };
      const result = updateRutinaSchema.safeParse(invalidHour);
      expect(result.success).toBe(false);
    });
  });

  describe('Auth Schemas (registerSchema & loginSchema)', () => {
    it('should validate correct user registration', () => {
      const validUser = {
        body: {
          email: 'padre@ejemplo.com',
          password: 'password123',
          nombre: 'Carlos Perez',
        },
      };
      const result = registerSchema.safeParse(validUser);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email format in registration', () => {
      const invalidEmail = {
        body: {
          email: 'no-es-un-email',
          password: 'password123',
          nombre: 'Carlos',
        },
      };
      const result = registerSchema.safeParse(invalidEmail);
      expect(result.success).toBe(false);
    });

    it('should reject passwords shorter than 6 characters', () => {
      const shortPass = {
        body: {
          email: 'padre@ejemplo.com',
          password: '123',
          nombre: 'Carlos',
        },
      };
      const result = registerSchema.safeParse(shortPass);
      expect(result.success).toBe(false);
    });

    it('should validate login credentials', () => {
      const validLogin = {
        body: {
          email: 'test@example.com',
          password: 'mypassword',
        },
      };
      expect(loginSchema.safeParse(validLogin).success).toBe(true);
    });
  });

  describe('Child Schema (childSchema)', () => {
    it('should validate a child profile', () => {
      const validChild = {
        body: {
          name: 'Mateo',
          birthDate: '2019-05-15',
        },
      };
      const result = childSchema.safeParse(validChild);
      expect(result.success).toBe(true);
    });

    it('should reject empty child name', () => {
      const invalidChild = {
        body: {
          name: '',
        },
      };
      const result = childSchema.safeParse(invalidChild);
      expect(result.success).toBe(false);
    });
  });

  describe('Device Config Schemas (updateDeviceConfigSchema)', () => {
    it('should validate valid device configuration', () => {
      const validConfig = {
        body: {
          volume: 75,
          eyeLights: true,
          vibration: false,
          nightMode: true,
          personality: 'curioso y amigable',
        },
      };
      const result = updateDeviceConfigSchema.safeParse(validConfig);
      expect(result.success).toBe(true);
    });

    it('should allow partial update of device config', () => {
      const partialConfig = {
        body: {
          volume: 30,
        },
      };
      const result = updateDeviceConfigSchema.safeParse(partialConfig);
      expect(result.success).toBe(true);
    });

    it('should reject volume out of range (< 0 or > 100)', () => {
      const invalidVolume = {
        body: {
          volume: 150,
        },
      };
      const result = updateDeviceConfigSchema.safeParse(invalidVolume);
      expect(result.success).toBe(false);
    });
  });

  describe('Push Token Schema (updatePushTokenSchema)', () => {
    it('should accept valid Expo push token', () => {
      const validPush = {
        body: {
          pushToken: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]',
        },
      };
      const result = updatePushTokenSchema.safeParse(validPush);
      expect(result.success).toBe(true);
    });

    it('should reject push token that is too short', () => {
      const shortPush = {
        body: {
          pushToken: 'abc',
        },
      };
      const result = updatePushTokenSchema.safeParse(shortPush);
      expect(result.success).toBe(false);
    });
  });
});
