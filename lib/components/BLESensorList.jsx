'use strict';

import React from 'react';
import PropTypes from 'prop-types';
import Button from 'react-bootstrap/Button';

const BLESensorList = ({
    sensors,
    onReadSensorValue,
    onSwitchSensor,
    onSelectSensor,
}) => {
    return (
        <div className="ble-sensor-list">
            {sensors.map(sensor => 
                <div className="ble-sensor-item">
                    <div className="ble-sensor-name">{sensor.name}</div>
                    <div className="ble-sensor-value">
                        {sensor.value}
                        &nbsp;
                        {sensor.unit}
                    </div>
                    {sensor.characteristic && sensor.characteristic.properties.read && <Button className="ble-sensor-action" onClick={e => onReadSensorValue(sensor,e)}>Refresh</Button>}
                    {sensor.characteristic && sensor.characteristic.properties.notify && <Button className="ble-sensor-action" onClick={e => onSwitchSensor(sensor,!sensor.isOn,e)}><i className={sensor.isOn ? 'mdi mdi-stop' : 'mdi mdi-play'}/></Button>}
                    <Button className="ble-sensor-action" onClick={e => onSelectSensor(sensor,e)} variant="secondary">Chart</Button>
                </div>
            )}
        </div>
    );
}

BLESensorList.propTypes = {
    sensors: PropTypes.object.isRequired,
    onReadSensorValue: PropTypes.func,
    onSwitchSensor: PropTypes.func,
    onSelectSensor: PropTypes.func,
}

export default BLESensorList;