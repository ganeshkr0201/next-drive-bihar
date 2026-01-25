// Custom hook for form handling
// Reduces duplication of form state management and submission logic

import { useState, useCallback } from 'react';
import { useLoading } from './useLoading';

export const useForm = (initialValues = {}, validationRules = {}) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const { isLoading, withLoading } = useLoading();

  // Handle input changes
  const handleChange = useCallback((name, value) => {
    setValues(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  }, [errors]);

  // Handle input blur (for validation)
  const handleBlur = useCallback((name) => {
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));

    // Validate field on blur
    if (validationRules[name]) {
      const error = validationRules[name](values[name], values);
      if (error) {
        setErrors(prev => ({
          ...prev,
          [name]: error
        }));
      }
    }
  }, [validationRules, values]);

  // Validate all fields
  const validate = useCallback(() => {
    const newErrors = {};
    let isValid = true;

    Object.keys(validationRules).forEach(field => {
      const error = validationRules[field](values[field], values);
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [validationRules, values]);

  // Handle form submission
  const handleSubmit = useCallback((onSubmit) => {
    return async (e) => {
      e.preventDefault();
      
      // Mark all fields as touched
      const allTouched = Object.keys(values).reduce((acc, key) => {
        acc[key] = true;
        return acc;
      }, {});
      setTouched(allTouched);

      // Validate form
      if (!validate()) {
        return;
      }

      // Submit form with loading state
      return withLoading(() => onSubmit(values));
    };
  }, [values, validate, withLoading]);

  // Reset form
  const reset = useCallback((newValues = initialValues) => {
    setValues(newValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  // Set field value
  const setValue = useCallback((name, value) => {
    setValues(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  // Set field error
  const setError = useCallback((name, error) => {
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  }, []);

  // Get field props for input components
  const getFieldProps = useCallback((name) => ({
    value: values[name] || '',
    onChange: (e) => handleChange(name, e.target.value),
    onBlur: () => handleBlur(name),
    error: touched[name] && errors[name]
  }), [values, handleChange, handleBlur, touched, errors]);

  return {
    values,
    errors,
    touched,
    isLoading,
    handleChange,
    handleBlur,
    handleSubmit,
    validate,
    reset,
    setValue,
    setError,
    getFieldProps,
    isValid: Object.keys(errors).length === 0,
    isDirty: JSON.stringify(values) !== JSON.stringify(initialValues)
  };
};

// Common validation rules
export const validationRules = {
  required: (value) => {
    if (!value || (typeof value === 'string' && !value.trim())) {
      return 'This field is required';
    }
    return '';
  },

  email: (value) => {
    if (!value) return '';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return 'Please enter a valid email address';
    }
    return '';
  },

  minLength: (min) => (value) => {
    if (!value) return '';
    if (value.length < min) {
      return `Must be at least ${min} characters long`;
    }
    return '';
  },

  maxLength: (max) => (value) => {
    if (!value) return '';
    if (value.length > max) {
      return `Must be no more than ${max} characters long`;
    }
    return '';
  },

  phone: (value) => {
    if (!value) return '';
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(value)) {
      return 'Please enter a valid 10-digit phone number';
    }
    return '';
  },

  passwordMatch: (confirmPassword, values) => {
    if (!confirmPassword) return '';
    if (confirmPassword !== values.password) {
      return 'Passwords do not match';
    }
    return '';
  }
};

export default useForm;