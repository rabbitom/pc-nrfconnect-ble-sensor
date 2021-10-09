'use strict';

import React from 'react';
import PropTypes from 'prop-types';
import Button from 'react-bootstrap/Button';

const BLESensorList = ({
    device,
    sensors,
    onReadSensorValue,
    onSelectSensor
}) => {
    return (
        <div className="ble-sensor-list">
            {sensors.map(sensor => 
                <div className="ble-sensor-item">
                    <div className="ble-sensor-name">{sensor.name}</div>
                    <div className="ble-sensor-value">
                        {sensor.value}
                        {sensor.unit}
                    </div>
                    <Button onClick={e => onReadSensorValue(device,sensor,e)}>Refresh</Button>&nbsp;
                    <Button onClick={e => onSelectSensor(sensor,e)} variant="secondary">Chart</Button>
                </div>
            )}
        </div>
    );
}

BLESensorList.propTypes = {
    device: PropTypes.object.isRequired,
    sensors: PropTypes.object.isRequired,
    onReadSensorValue: PropTypes.func,
    onSelectSensor: PropTypes.func
}

export default BLESensorList;