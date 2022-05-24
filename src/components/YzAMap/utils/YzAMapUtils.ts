import isPolygon from './polygon';

const { AMap, Loca } = window as any;

class YzAMapUtils {
  /**
   * 地图
   */
  static AMap = AMap;

  /**
   * 可视化数据
   */
  static Loca = Loca;

  /**
   * 默认3d热力图layer配置
   */
  static default3dLayerOptions = {
    zIndex: 10,
    opacity: 1,
    visible: true,
    zooms: [2, 30],
  };

  /**
   * 默认的3d热力图配置
   */
  static default3dOptions = {
    radius: 1200,
    unit: 'meter',
    value: (_: any, feature: any) => {
      return feature.properties.count;
    },
    gradient: {
      0.1: '#2A85B8',
      0.5: 'blue',
      0.65: 'rgb(117,211,248)',
      0.7: 'rgb(0, 255, 0)',
      0.9: '#ffea00',
      1.0: 'red',
    },
  };

  /**
   * 创建3d热力图数据源
   * @param heatMapDataList
   * @returns
   */
  static createGeoJSONSource = (heatMapDataList: any = []) => {
    const data = {
      type: 'FeatureCollection',
      features: heatMapDataList.map((v: any) => {
        return {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [v.lng, v.lat],
          },
          properties: {
            count: v.count,
          },
        };
      }),
    };

    return new Loca.GeoJSONSource({
      data,
    });
  };

  /**
   * 创建layer
   * @param layerOptions
   * @param options
   * @param geo
   * @returns
   */
  static create3dHeatMapLayer = (layerOptions: any, options: any, geo: any) => {
    const heatMapLayer = new Loca.HeatMapLayer(
      layerOptions || YzAMapUtils.default3dLayerOptions
    );

    heatMapLayer.setSource(
      geo ||
        new Loca.GeoJSONSource({
          data: [],
        }),
      options || YzAMapUtils.default3dOptions
    );
    return heatMapLayer;
  };

  /**
   * 创建3d热力图
   * @param map
   * @param heatMapDataList
   * @returns
   */
  static create3dHeatMap = (
    map: any,
    heatMapDataList: any,
    options = {},
    layerOptions = {}
  ) => {
    const loca = new Loca.Container({
      map,
    });

    const geo = YzAMapUtils.createGeoJSONSource(heatMapDataList);

    const heatMapLayer = new Loca.HeatMapLayer({
      loca,
      ...YzAMapUtils.default3dLayerOptions,
      ...layerOptions,
    });

    const newOptions = {
      ...YzAMapUtils.default3dOptions,
      ...(options || {}),
    };

    heatMapLayer.setSource(geo, newOptions);
    loca.add(heatMapLayer);

    return {
      heatMapLayer,
      geoJSONSource: geo,
      loca,
      newOptions,
    };
  };

  /**
   * 限制显示距离
   * targetLngLat集合中所有的LngLat都没有距离targetLngLat超出distance距离, 则地图中心点, lngLatList, targetLngLat的点自适应
   * @param map
   * @param distance
   * @param lngLatList
   * @param targetLngLat 目标点 如果不传, 则默认为地图的中心点
   * @param allOverlays 所有需要包含的overlay 如果不传, 则默认包含地图中所有的覆盖物
   */
  static limitDistance = (
    map: any,
    distance: any,
    lngLatList = [],
    targetLngLat: any,
    allOverlays = []
  ) => {
    const target = targetLngLat || map.getCenter();
    // 是否超过距离
    const moreThan = lngLatList.some(v => {
      return target.distance(v) > distance;
    });
    // 自适应
    // 超过最大距离则只显示最大距离内的数据
    // 没超过最大距离则自适应所有数据
    if (moreThan) {
      const top = target.offset(0, distance);
      const right = target.offset(distance, 0);
      const bottom = target.offset(0, -distance);
      const left = target.offset(-distance, 0);
      const overlays = [
        new AMap.Marker({
          position: top,
        }),
        new AMap.Marker({
          position: right,
        }),
        new AMap.Marker({
          position: bottom,
        }),
        new AMap.Marker({
          position: left,
        }),
      ];
      map.setFitView(overlays, false, [60, 60, 60, 60]);
    } else {
      map.setFitView(allOverlays, false, [60, 60, 60, 60]);
    }
  };

  /**
   * 限制中心点四周distance距离以内
   * @param map
   * @param distance
   */
  static limitCenterDistance = (map: any, distance: any) => {
    const target = map.getCenter();

    const top = target.offset(0, distance);
    const right = target.offset(distance, 0);
    const bottom = target.offset(0, -distance);
    const left = target.offset(-distance, 0);
    const overlays = [
      new AMap.Marker({
        position: top,
      }),
      new AMap.Marker({
        position: right,
      }),
      new AMap.Marker({
        position: bottom,
      }),
      new AMap.Marker({
        position: left,
      }),
    ];
    map.setFitView(overlays, false, [60, 60, 60, 60]);
  };

  /**
   * 通过plotSpots创建板块
   * @param plotSpots
   * @param options
   * @returns
   */
  static createPlateByPoltSpots = (plotSpots: any, options = {}) => {
    const path = plotSpots.split(';').map((v1: any) => {
      const splits = v1.split(',');
      return new AMap.LngLat(splits[0], splits[1]);
    });
    const polygon = new AMap.Polygon({
      path,
      ...options,
    });
    return polygon;
  };

  /**
   * 是否是合法的多边形(线段不能相交)
   * @param pointData
   * @returns
   */
  static isPolygon = (pointData: any) => {
    return isPolygon(pointData);
  };

  /**
   * 获取多边形重心点
   * @param polygon
   * @returns
   */
  static getPolygonCenter = (polygon: AMap.Polygon): AMap.LngLat => {
    const pointList = polygon.getPath() as AMap.LngLat[];
    //多边形面积
    let area = 0.0;
    // 重心的x、y
    let gx = 0.0;
    let gy = 0.0;
    for (let i = 1; i <= pointList.length; i++) {
      const iLat = pointList[i % pointList.length].getLat();
      const iLng = pointList[i % pointList.length].getLng();
      const nextLat = pointList[i - 1].getLat();
      const nextLng = pointList[i - 1].getLng();
      const temp = (iLat * nextLng - iLng * nextLat) / 2.0;
      area += temp;
      gx += (temp * (iLat + nextLat)) / 3.0;
      gy += (temp * (iLng + nextLng)) / 3.0;
    }
    gx = gx / area;
    gy = gy / area;
    return new AMap.LngLat(gy, gx);
  };
}

export default YzAMapUtils;
