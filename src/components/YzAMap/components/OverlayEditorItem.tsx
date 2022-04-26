import React, { useEffect, useState } from 'react';
import './OverlayEditorItem.css';
import IconFont from '../../IconFont';
import Colors from '../constants/Colors';
import { Space } from 'antd';

export type OnEdit = (data: OverlayItem) => void;
export type OnRemove = (data: OverlayItem) => void;
export type OnPlate = (data: OverlayItem) => void;

export interface OverlayItem {
  id: React.Key;
  label: string;
  value: any;
  custom?: React.ReactNode;
}

export interface IProps {
  data: OverlayItem;
  onEdit?: OnEdit;
  onPlate?: OnPlate;
  onRemove?: OnRemove;
  active?: boolean;
}

const OverlayEditorItem = ({
  data,
  onEdit = () => {},
  onPlate = () => {},
  onRemove = () => {},
  active = false,
}: IProps) => {
  const [hover, setHover] = useState(false);

  useEffect(() => {
    const beforeOptions = data.value.getOptions();
    if (hover) {
      data.value.setOptions({
        fillColor: Colors.SELECTED_COLOR,
        strokeColor: Colors.SELECTED_COLOR,
      });
    }

    return () => {
      data?.value.setOptions({
        fillColor: beforeOptions.fillColor,
        strokeColor: beforeOptions.strokeColor,
      });
    };
  }, [hover, data]);

  return (
    <div
      className="yz-amap-overlay-editor-item"
      title={data.label}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className="yz-amap-overlay-editor-item-title">{data.label}</div>
      <div className="yz-amap-overlay-editor-item-action">
        <Space>
          <IconFont
            type="icon-edit"
            onClick={() => {
              onEdit(data);
            }}
          />

          <IconFont
            type="icon-mianji"
            style={active ? { color: '#2eb3b2' } : undefined}
            onClick={() => {
              onPlate(data);
            }}
          />

          <IconFont
            type="icon-delete"
            onClick={() => {
              onRemove(data);
            }}
          />
        </Space>
      </div>
    </div>
  );
};

export default OverlayEditorItem;
