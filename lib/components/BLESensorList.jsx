'use strict';

import React from 'react';
import PropTypes from 'prop-types';

const BLESensorList = ({
    sensors
}) => {
    return (
        <div className="ble-sensor-list">
            {sensors.map(sensor => <div className="ble-sensor-item">{sensor.name}</div>)}
        </div>
    );
}

BLESensorList.propTypes = {
    // device: PropTypes.object.isRequired,
    sensors: PropTypes.object.isRequired
}

export default BLESensorList;