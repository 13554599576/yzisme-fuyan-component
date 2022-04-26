import { Button, Input, Modal, Space } from 'antd';
import React, { useState, useRef } from 'react';
import './OverlayEditor.css';
import OverlayEditorItem, {
  OverlayItem,
  OnEdit,
  OnPlate,
  OnRemove,
} from './OverlayEditorItem';

export interface IProps {
  dataSource: OverlayItem[];
  onChange: (value: OverlayItem[]) => void;
  style?: React.CSSProperties;
  onEdit?: OnEdit;
  onPlate?: OnPlate;
  onRemove?: OnRemove;
  activeItem?: OverlayItem;
  map: AMap.Map;
}

const OverlayEditor = ({
  dataSource = [],
  onChange = () => {},
  style,
  onEdit,
  onPlate,
  onRemove,
  activeItem,
  map,
}: IProps) => {
  const [overlayEdited, setOverlayEdited] = useState<OverlayItem>();
  const polygonEditorRef = useRef(new (AMap as any).PolygonEditor(map));
  const circleEditorRef = useRef(new (AMap as any).PolygonEditor(map));

  // 设置修改名称modal的显示隐藏
  const [visible, setVisible] = useState(false);
  // 修改名称modal的input的value属性
  const [plateName, setPlateName] = useState('');
  // 当前将要被修改的数据
  const [selectedData, setSelectedData] = useState<OverlayItem>();

  /**
   * 编辑图标的默认点击事件
   */
  const defaultOnEdit = (data: OverlayItem) => {
    setVisible(true);
    setSelectedData(data);
  };

  /**
   * 退出modal
   */
  const onCancel = () => {
    setVisible(false);
    setPlateName('');
    setSelectedData(undefined);
  };

  /**
   * 确认修改名称
   */
  const onOk = () => {
    selectedData!.label = plateName;
    onChange([...dataSource]);
    onCancel();
  };

  const defaultOnPlate = (data: OverlayItem) => {
    if (data.value instanceof AMap.Polygon) {
      if (overlayEdited === data) {
        setOverlayEdited(undefined);
        polygonEditorRef.current.close();
      } else {
        setOverlayEdited(data);
        polygonEditorRef.current.setTarget(data.value);
        polygonEditorRef.current.open();
      }
    } else if (data.value instanceof AMap.Circle) {
      if (overlayEdited === data) {
        setOverlayEdited(undefined);
        circleEditorRef.current.close();
      } else {
        setOverlayEdited(data);
        circleEditorRef.current.setTarget(data.value);
        circleEditorRef.current.open();
      }
    }
  };

  const defaultRemove = (data: OverlayItem) => {
    if (data.value instanceof AMap.Polygon) {
      polygonEditorRef.current.close();
    } else if (data.value instanceof AMap.Circle) {
      circleEditorRef.current.close();
    }
    onChange(dataSource.filter(v => v !== data));
    if (data.value) {
      map.remove(data.value);
    }
  };

  return (
    <>
      {dataSource.length > 0 && (
        <div className="yz-amap-overlay-editor" style={style}>
          {dataSource.map(v => {
            return (
              <OverlayEditorItem
                key={v.id}
                data={v}
                onEdit={onEdit || defaultOnEdit}
                onPlate={onPlate || defaultOnPlate}
                onRemove={onRemove || defaultRemove}
                active={overlayEdited === v || activeItem === v}
              />
            );
          })}
        </div>
      )}

      <Modal
        visible={visible}
        title="改变板块的名称"
        onCancel={onCancel}
        footer={
          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={onCancel}>关闭</Button>
              <Button type="primary" onClick={onOk}>
                确认
              </Button>
            </Space>
          </div>
        }
      >
        <Input
          placeholder={selectedData?.label}
          value={plateName}
          onChange={e => setPlateName(e.target.value)}
        />
      </Modal>
    </>
  );
};

export default OverlayEditor;
