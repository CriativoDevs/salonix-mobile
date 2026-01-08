export const parseApiError = (
  error,
  fallbackMessage = "Erro ao processar requisição"
) => {
  if (!error) return fallbackMessage;

  const response = error?.response;
  const data = response?.data;

  if (data?.error?.message) {
    return data.error.message;
  }

  if (data?.detail) {
    return data.detail;
  }

  if (data?.message) {
    return data.message;
  }

  if (typeof data === "string") {
    return data;
  }

  if (error.message) {
    return error.message;
  }

  return fallbackMessage;
};

export const hasActionableError = (errorCode) => {
  const actionableErrors = [
    "AUTHENTICATION_REQUIRED",
    "PERMISSION_DENIED",
    "RESOURCE_NOT_FOUND",
    "VALIDATION_ERROR",
  ];
  return actionableErrors.includes(errorCode);
};

export const getRequestId = (error) => {
  return error?.response?.headers?.["x-request-id"] || null;
};
