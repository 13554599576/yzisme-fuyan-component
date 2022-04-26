import React, { useEffect, useRef, useState } from 'react';
import { message, Select } from 'antd';
import './Search.css';

const { AMap } = window as any;

export interface IProps {
  children?: React.ReactNode;
  options?: any;
  onCreate?: (autoComplete: any) => void;
  value?: string;
  onChange?: (value: string) => void;
  callback?: (status: any, result: any) => void;
  map?: AMap.Map;
  style?: React.CSSProperties;
  tipStyle?: React.CSSProperties;
  inputStyle?: React.CSSProperties;
}

/**
 * 搜索
 * @param param0
 * @returns
 */
const Search = ({
  options = {},
  onCreate = () => {},
  callback,
  map,
  inputStyle,
}: IProps) => {
  // PlaceSearch对象
  const placeSearchRef = useRef<any>(new AMap.PlaceSearch(options));
  // 持久化onCreate
  const onCreateRef = useRef(onCreate);
  onCreateRef.current = onCreate;
  // 持久化callback
  const callbackRef = useRef(callback);
  callbackRef.current = callback;
  // 聚焦input
  // const [focus, setFocus] = useState(false);
  // 提示内容
  const [tips, setTips] = useState<any[]>([]);
  // 点击提示内容的点
  const markerRef = useRef<AMap.Marker>();
  // 显示隐藏下拉
  // const [open, setOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  /**
   * 搜索
   * @param val
   */
  const onSearch = (val: string) => {
    if (val) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = undefined;
      }
      const myCallback = (status: string, result: any) => {
        if (status === 'complete') {
          if (result.info === 'OK') {
            setTips(result.poiList.pois);
          }
        }
      };
      timeoutRef.current = setTimeout(() => {
        placeSearchRef.current.search(val, callbackRef.current || myCallback);
      }, 300);
    } else {
      setTips([]);
    }
  };

  /**
   * 选择
   * @param id
   */
  const onSelect = (id: string) => {
    const data = tips.find(v => v.id === id);
    if (data) {
      // 先移除上一个marker
      if (markerRef.current) {
        map?.remove(markerRef.current);
      }
      // 设置中心
      map?.setCenter(data.location);
      // 添加新的marker
      markerRef.current = new AMap.Marker({
        position: data.location,
      });
      map?.add(markerRef.current!);
    } else {
      message.warning('无该地址的坐标点数据!');
    }
  };

  /**
   * 创建搜索
   */
  useEffect(() => {
    onCreateRef.current({
      placeSearch: placeSearchRef.current,
    });

    return () => {
      if (markerRef.current) {
        map?.remove(markerRef.current);
        markerRef.current = undefined;
      }
    };
  }, [map]);

  return (
    <div className="yz-amap-search">
      <Select
        showSearch
        placeholder="请输入搜索内容"
        style={inputStyle}
        filterOption={false}
        onSearch={onSearch}
        onSelect={onSelect}
      >
        {tips.map(v => {
          return (
            <Select.Option key={v.id} value={v.id}>
              <div className="yz-amap-search-tips-item-name">{v.name}</div>
              <div className="yz-amap-search-tips-item-district">
                {v.address}
              </div>
            </Select.Option>
          );
        })}
      </Select>
    </div>
  );
};

export default Search;
