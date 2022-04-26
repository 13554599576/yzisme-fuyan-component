import React from 'react';
import { createPortal } from 'react-dom';
import './AddAndRemoveBtn.css';
import PlusPng from '../images/plus.png';
import DeletePng from '../images/delete.png';

export interface IProps {
  container: HTMLElement;
  onAddClick?: (e: any) => void;
  showAdd?: boolean;
  onRemoveClick?: (e: any) => void;
  showRemove?: boolean;
}

/**
 * 板块编辑时的添加和删除按钮
 * container: 容器. dom元素
 * onAddClick: 添加按钮点击事件
 * showAdd: 是否展示添加按钮
 * onRemoveClick: 删除按钮点击事件
 * showHide: 是否展示删除按钮
 *
 * @param {*} param0
 * @returns
 */
const AddAndRemoveBtn = ({
  container,
  onAddClick,
  onRemoveClick,
  showAdd = true,
  showRemove = true,
}: IProps) => {
  if (!container) {
    return null;
  }

  return createPortal(
    <div className="yz-amap-add-and-remove-btn">
      {showAdd && <img src={PlusPng} alt="..." onClick={onAddClick} />}
      {showRemove && <img src={DeletePng} alt="..." onClick={onRemoveClick} />}
    </div>,
    container
  );
};

export default AddAndRemoveBtn;
