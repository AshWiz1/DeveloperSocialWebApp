import React from 'react';
import PropTypes from 'prop-types';
import Moment from 'react-moment';

const ProfileEducation = ({
  education: { degree, school, fieldofstudy, current, to, from, description },
}) => {
  return (
    <div>
      <h3 className='text-dark'>{school}</h3>
      <p>
        <Moment format='YYYY/MM/DD'>{from}</Moment> -{' '}
        <Moment format='YYYY/MM/DD'>{to}</Moment>
      </p>
      <p>
        <strong>degree : </strong>
        {degree}
      </p>
      <p>
        <strong>fieldofstudy : </strong>
        {fieldofstudy}
      </p>
      <p>
        <strong>Description : </strong>
        {description}
      </p>
    </div>
  );
};

ProfileEducation.propTypes = {
  education: PropTypes.array.isRequired,
};

export default ProfileEducation;
