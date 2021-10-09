'use strict';

import React from 'react';
import PropTypes from 'prop-types';

const BLESensorData = ({
    device,
    sensor
}) => {
    return (
        <div className="ble-sensor-data">
            Some Sensor
            {/* {sensor.name} */}
        </div>
    );
}

BLESensorData.propTypes = {
    device: PropTypes.object.isRequired,
    sensor: PropTypes.object.isRequired
}

export default BLESensorData;