/* eslint-disable import/no-cycle */
import { auth } from './api.js';
import { performMonolithGraphQLQuery } from '../commerce.js';

const generateCustomerTokenMutation = `mutation generateCustomerToken($email: String!, $password: String!) {
    generateCustomerToken(email: $email, password: $password) {
        token
    }
  }
`;

const revokeCustomerTokenMutation = `mutation revokeCustomerToken {
    revokeCustomerToken {
        result
    }
  }
`;

const requestPasswordResetEmailMutation = `mutation requestPasswordResetEmail($email: String!) {
    requestPasswordResetEmail(email: $email)
  }
`;

const resetPasswordMutation = `mutation resetPassword(
      $email: String!, 
      $resetPasswordToken: String!, 
      $newPassword: String!
    ) {
      resetPassword(
          email: $email, 
          resetPasswordToken: $resetPasswordToken, 
          newPassword: newPassword
          )
  }
`;

const createCustomerV2Mutation = `mutation createCustomerV2(
    $firstname: String!, 
    $lastname: String!, 
    $email: String!
    $password: String
    $is_subscribed: Boolean
) {
    createCustomerV2(
      firstname: $firstname,
      lastname: $lastname,
      email: $email, 
      password: $password, 
      is_subscribed: $is_subscribed
      )
  }
`;

export {
  generateCustomerTokenMutation,
  revokeCustomerTokenMutation,
  requestPasswordResetEmailMutation,
  resetPasswordMutation,
  createCustomerV2Mutation,
};

const handleAuthErrors = (errors) => {
  if (!errors) {
    return;
  }

  // Customer account cannot be found
  if (errors.some(({ extensions }) => extensions?.category === 'graphql-authentication')) {
    // eslint-disable-next-line no-console
    console.error('The account sign-in was incorrect or your account is disabled temporarily. Please wait and try again later.');
    return;
  }

  // Throw everything else
  throw new Error(errors);
};

export async function generateCustomerToken(email, password) {
  const variables = {
    email,
    password,
  };

  try {
    const { data, errors } = await performMonolithGraphQLQuery(
      generateCustomerTokenMutation,
      variables,
      false,
      false,
    );
    handleAuthErrors(errors);
    auth.setToken(data.generateCustomerToken.token);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Could not log customer in', err);
  }
}

export async function revokeCustomerToken() {
  const variables = {};

  try {
    const { data, errors } = await performMonolithGraphQLQuery(
      revokeCustomerTokenMutation,
      variables,
      false,
      true,
    );
    handleAuthErrors(errors);
    auth.logout(data);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Could not log customer out', err);
  }
}

export async function requestPasswordResetEmail(email) {
  const variables = {
    email,
  };

  try {
    const { data, errors } = await performMonolithGraphQLQuery(
      requestPasswordResetEmailMutation,
      variables,
      false,
      true,
    );
    handleAuthErrors(errors);
    // TODO: Handle response
    // eslint-disable-next-line no-console
    console.log(data.requestPasswordResetEmail);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Could not create password reset request', err);
  }
}

export async function resetPassword(email, resetPasswordToken, newPassword) {
  const variables = {
    email,
    resetPasswordToken,
    newPassword,
  };

  try {
    const { data, errors } = await performMonolithGraphQLQuery(
      resetPasswordMutation,
      variables,
      false,
      true,
    );
    handleAuthErrors(errors);
    // TODO: Handle response
    // eslint-disable-next-line no-console
    console.log(data.resetPassword);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Could not reset password', err);
  }
}

export async function createCustomerV2(
  firstname,
  lastname,
  email,
  password,
  isSubscribed = false,
) {
  const variables = {
    firstname,
    lastname,
    email,
    password,
    is_subscribed: isSubscribed,
  };

  try {
    const { data, errors } = await performMonolithGraphQLQuery(
      createCustomerV2Mutation,
      variables,
      false,
      true,
    );
    handleAuthErrors(errors);
    // TODO: Handle response
    // eslint-disable-next-line no-console
    console.log(data.resetPassword);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Could not reset password', err);
  }
}
