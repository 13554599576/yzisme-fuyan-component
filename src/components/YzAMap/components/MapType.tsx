import React, { useEffect, useRef, useState } from 'react';
import './MapType.css';
import DefaultPng from '../images/default.png';
import WhiteSmokePng from '../images/white-smoke.png';
import SatellitePng from '../images/satellite.png';
import YzAMapUtils from '../utils/YzAMapUtils';

const { AMap } = YzAMapUtils; 

export interface Item {
  key: string;
  value: any;
}

interface IProps {
  dataSource?: Item[];
  value: string;
  onChange?: (key: string) => void;
  map: any;
}

/**
 * 切换地图类型
 * dataSource: 展示的图片数据，以及key标识
 * mapType: satellite 卫星地图，     也可填默认样式以及自定义样式
 * onChange: mapType变化事件。 返回dataSource的key
 * map: 地图实例
 * @param {*} param0
 * @returns
 */
const MapType = ({
  dataSource = [
    { key: 'normal', value: DefaultPng },
    { key: 'whitesmoke', value: WhiteSmokePng },
    { key: 'satellite', value: SatellitePng },
  ],
  value = 'normal',
  onChange = () => {},
  map,
}: IProps) => {
  const [finalImage, setFinalImage] = useState(); // 最后展示的图片
  const [hover, setHover] = useState(false); // 右下角聚焦
  const timeoutRef = useRef<NodeJS.Timeout>(); // timeout

  useEffect(() => {
    // 卫星图层
    const satelliteLayer = new AMap.TileLayer.Satellite();

    if (value === 'satellite') {
      map.add(satelliteLayer);
    } else {
      map.setMapStyle(`amap://styles/${value}`);
    }

    return () => {
      map.remove(satelliteLayer);
    };
  }, [value, map]);

  /**
   * 设置最终显示的图片
   */
  useEffect(() => {
    setFinalImage(dataSource.find(v => v.key === value)?.value);
  }, [dataSource, value]);

  /**
   * 清理timeout
   */
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      <div
        className="yz-amap-map-type-final"
        style={{ display: hover ? 'none' : undefined }}
        onMouseEnter={() => setHover(true)}
      >
        <img src={finalImage} alt="..." />
      </div>

      <div
        className="yz-amap-map-type"
        style={{ display: hover ? undefined : 'none' }}
        onMouseLeave={() => {
          timeoutRef.current = setTimeout(() => {
            setHover(false);
          }, 250);
        }}
      >
        {dataSource.map(v => {
          return (
            <div
              key={v.key}
              className="item"
              style={{
                border: value === v.key ? '1px solid #1da57a' : undefined,
              }}
              onClick={() => {
                onChange(v.key);
              }}
            >
              <img src={v.value} alt="..." />
            </div>
          );
        })}
      </div>
    </>
  );
};

export default MapType;
