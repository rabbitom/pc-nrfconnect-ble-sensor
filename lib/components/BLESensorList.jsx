'use strict';

import React from 'react';
import PropTypes from 'prop-types';

const BLESensorList = ({
    device,
    sensors,
    onSelectSensor
}) => {
    return (
        <div className="ble-sensor-list">
            {sensors.map(sensor => <div className="ble-sensor-item" onClick={e => onSelectSensor(sensor,e)}>{sensor.name}</div>)}
        </div>
    );
}

BLESensorList.propTypes = {
    device: PropTypes.object.isRequired,
    sensors: PropTypes.object.isRequired,
    onSelectSensor: PropTypes.func
}

export default BLESensorList;