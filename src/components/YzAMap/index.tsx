import React, {
  useEffect,
  useRef,
  useState,
  useImperativeHandle,
  forwardRef,
  useCallback,
} from 'react';
import './index.css';
import AddAndRemoveBtn from './components/AddAndRemoveBtn';
import YzAMapUtils from './utils/YzAMapUtils';
import * as MapType from './components/MapType';
import Search from './components/Search';
import OverlayEditor from './components/OverlayEditor';
import Status from './constants/Status';

const { AMap } = YzAMapUtils;

export interface CreateParams {
  map: AMap.Map;
  polygonEditor: any;
  polygon?: AMap.Polygon;
  circleEditor: any;
  circle?: AMap.Circle;
  tipMessageText: AMap.Text;
}

export interface Heatmap {
  data: any[];
  option: object;
  layerOption: object;
}

export interface IProps {
  // 样式
  style?: React.CSSProperties;
  // 容器id
  defaultId?: string;
  // 地图配置
  defaultMapOption?: AMap.MapOptions;
  // 创建地图完成时的回调
  onCreate?: (data: CreateParams) => void;
  // 左上角容器
  leftTop?: React.ReactNode;
  // 右上角容器
  rightTop?: React.ReactNode;
  // 左下角容器
  leftBottom?: React.ReactNode;
  // 右下角容器
  rightBottom?: React.ReactNode;
  // 是否绘制
  draw?: boolean;
  // 绘制覆盖物的类型: polygon板块 | circle圆
  drawType?: 'polygon' | 'circle';
  // 退出编辑
  onDrawCancel?: () => void;
  // 是否开启esc退出编辑
  openEscCancel?: boolean;
  // 提示信息
  tipMessage?: string;
  // 绘制时的提示信息
  drawTipMessage?: string;
  // 编辑时的提示信息
  editTipMessage?: string;

  // 添加按钮点击事件
  onAddClick?: (overlay: AMap.Polygon | AMap.Circle) => void;
  // 展示添加按钮
  showAdd?: boolean;
  // 删除按钮点击事件
  onRemoveClick?: (overlay: AMap.Polygon | AMap.Circle) => void;
  // 展示删除按钮
  showRemove?: boolean;

  // 热力图
  heatMap?: Heatmap;
  // 地图类型
  mapType?: string;
  // 地图类型改变事件
  onMapTypeChange?: (mapType: string) => void;
  // 地图类型数据
  mapTypeDataSource?: MapType.Item[];
}

/**
 * ref的属性
 */
export interface YzAMapRef {
  polygon?: AMap.Polygon;
}

/**
 * 地图额外扩展属性
 */
export interface YzAMapComponent
  extends React.ForwardRefExoticComponent<
    IProps & React.RefAttributes<YzAMapRef>
  > {
  YzAMapUtils?: YzAMapUtils;
  Search?: typeof Search;
  OverlayEditor?: typeof OverlayEditor;
  AddAndRemoveBtn?: typeof AddAndRemoveBtn;
}

/**
 * 额外扩展属性强转为必定存在(否则外部引用时，会提示 JSX元素类型'...'没有任何构造或调用签名”)
 */
interface YzAMapFinallComponent extends YzAMapComponent {
  YzAMapUtils: YzAMapUtils;
  Search: typeof Search;
  OverlayEditor: typeof OverlayEditor;
  AddAndRemoveBtn: typeof AddAndRemoveBtn;
}

/**
 * 高德地图组件
 *
 * style: 样式
 * defaultId: 地图容器的id
 * defaultMapOption: 初始化地图时的设置
 * onCreate: ({map,mouseTool...}) => {} 只会执行一次
 *
 * leftTop: 左上角容器
 * rightTop: 右上角容器
 * leftBottom: 左下角容器
 * rightBottom: 右下角容器
 *
 * draw: true开启/false关闭 绘制
 * onDrawCancel: () => {} 关闭绘制的回调
 *
 * tipMessage: 提示信息
 * drawTipMessage: 绘制时的提示信息
 * editTipMessage: 编辑时的提示信息
 *
 * onAddClick: 编辑时添加按钮点击事件
 * onRemoveClick: 编辑时删除按钮的点击事件
 *
 * heatMap: 热力图
 *    data: 热力图数据
 *    option: 热力图配置
 *    layerOption: 热力图layer配置
 *
 * mapType: 地图类型
 * onMapTypeChange: 地图类型切换, (mapType) => {}
 * mapTypeDataSource: 地图类型集合 [{key: string, value: image}, ...]
 *
 * @version 1.0.0
 * @author 袁玉晗
 * @returns
 */
const YzAMap: YzAMapComponent = forwardRef(
  (
    {
      style = {},
      defaultId = 'container',
      defaultMapOption = {},
      onCreate = () => {},
      leftTop,
      rightTop,
      leftBottom,
      rightBottom,

      draw = false,
      drawType = 'polygon',
      onDrawCancel = () => {},
      openEscCancel = true,

      tipMessage = '',
      drawTipMessage = '添加点：单击鼠标左键\n撤销点：单击鼠标右键\n完成绘制：双击鼠标左键\n关闭绘制：esc',
      editTipMessage = '删除点：单击白点\n移动点：拖拽实点或白点\n添加点：拖拽实点\n关闭绘制：esc',

      onAddClick = () => {},
      showAdd = true,
      onRemoveClick = () => {},
      showRemove = true,

      mapType,
      onMapTypeChange = () => {},
      mapTypeDataSource,
    }: IProps,
    ref: any
  ) => {
    const defaultIdRef = useRef(defaultId); // 持久化 defaultId
    const defaultMapOptionRef = useRef(defaultMapOption); // 持久化 defaultMapOption

    const onCreateRef = useRef(onCreate); // 持久化创建完成时的回调
    onCreateRef.current = onCreate;

    const onDrawCancelRef = useRef(onDrawCancel); // 持久化退出编辑的回调
    onDrawCancelRef.current = () => {
      onDrawCancel();
      setStatus(Status.NORMAL);
    };

    const map = useRef<AMap.Map>(); // map实例

    const tipMessageTextRef = useRef<AMap.Text>(); // 提示信息AMap.Text
    // TODO: 高德地图bug，tipMessageTextRef.current?.getText() 无法获取到最新的 text, 此处使用常量保存
    const tipMessageStrRef = useRef<string>();

    const mouseToolRef = useRef<any>(); // 鼠标工具实例
    const addAndRemoveMarkerRef = useRef<AMap.Marker>(); // 保存和删除按钮的mark
    const polygonEditorRef = useRef<any>(); // 多边形编辑工具实例
    const polygonRef = useRef<AMap.Polygon>(); // 绘制/编辑的多边形
    const circleEditorRef = useRef<any>(); // 圆编辑工具实例
    const circleRef = useRef<AMap.Circle>(); // 绘制/编辑的圆

    const [status, setStatus] = useState(Status.NORMAL); // 当前状态 NORMAL: 正常, DRAW: 绘制, EDIT: 编辑
    const [firstInitMapOver, setFirstInitMapOver] = useState(false); // 首次初始化完毕map
    const [addAndRemoveBtnContainer, setAddAndRemoveBtnContainer] = useState<
      any
    >(); // 添加/删除板块按钮的容器

    // const [drawedPolygonList, setDrawedPolygonList] = useState<any[]>([]); // 记录当前通过绘制生成的板块

    /**
     * 改变提示信息
     * @param str
     */
    const changeTipMessageText = (str: string) => {
      tipMessageTextRef.current?.setText(str);
      tipMessageStrRef.current = str;
    };

    // 校验多边形合法性(不可有交点)
    const checkPolygon = useCallback((pointData: AMap.LngLat[]) => {
      const check = YzAMapUtils.isPolygon(pointData);
      if (!check) {
        changeTipMessageText(
          `存在相交线段，多边形不合法\n${tipMessageStrRef.current}`
        );
      }
      return check;
    }, []);

    /**
     * 板块绘制完毕时，添加按钮事件
     * 板块不合法时，不执行onAddClick
     */
    const onMyAddClick = () => {
      if (drawType === 'polygon') {
        if (checkPolygon(polygonRef.current?.getPath() as AMap.LngLat[])) {
          onAddClick(polygonRef.current!);
        } else {
          alert('存在相交线段，多边形不合法。');
        }
      }
      if (drawType === 'circle') {
        onAddClick(circleRef.current!);
      }
    };

    /**
     * 点击删除按钮
     */
    const onMyRemoveClick = () => {
      if (drawType === 'polygon') {
        onRemoveClick(polygonRef.current!);
      }
      if (drawType === 'circle') {
        onRemoveClick(circleRef.current!);
      }
    };

    // 生成 添加/删除 按钮
    const generateBtn = (position: AMap.LngLat) => {
      // 生成前先移除之前的按钮
      if (addAndRemoveMarkerRef.current) {
        map.current?.remove(addAndRemoveMarkerRef.current);
      }
      addAndRemoveMarkerRef.current = new AMap.Marker({
        position,
        content: '<div id="yz-amap-add-and-remove-btn-container"></div>',
        offset: new AMap.Pixel(-48, -35),
        cursor: 'auto',
      });
      map.current?.add(addAndRemoveMarkerRef.current!);
      // 设置新增和删除按钮的容器
      const element = document.querySelector(
        '#yz-amap-add-and-remove-btn-container'
      );
      if (element) {
        setAddAndRemoveBtnContainer(element);
      }
    };

    /**
     * 开启绘制时记录所有overlay的bubble，并且设置为true。绘制结束后设置会本身的bubble
     */
    const allOverlayBubbleChange = () => {
      const allOverlays = map.current?.getAllOverlays();
      // 记录overlay本身的bubble信息到extData，并设置overlay的bubble为true
      allOverlays?.forEach((v: any) => {
        v.setExtData({
          ...v.getExtData(),
          bubble: v.getOptions().bubble,
        });
        v.setOptions({
          bubble: true,
        });
      });

      return () => {
        allOverlays?.forEach((v: any) => {
          v.setOptions({
            bubble: v.getExtData().bubble,
          });
        });
      };
    };

    /**
     * 向外部暴露实例
     * polygon: 当前绘制/编辑的polygon
     */
    useImperativeHandle(
      ref,
      () => {
        return {
          polygon: polygonRef,
        };
      },
      []
    );

    /**
     * 初始化地图
     * 卸载时，清理地图
     */
    useEffect(() => {
      // 初始化地图实例
      const map1 = new AMap.Map(
        defaultIdRef.current,
        defaultMapOptionRef.current
      );
      map.current = map1;
      // 初始化提示信息text
      tipMessageTextRef.current = new AMap.Text({
        offset: [10, 10],
        style: {
          background: 'rgba(0,0,0,0.5)',
          color: 'white',
          'font-size': '14px',
          padding: '4px 6px',
          'white-space': 'pre',
        },
        anchor: 'top',
      });
      tipMessageTextRef.current?.hide();
      map1.add(tipMessageTextRef.current);

      // 初始化鼠标绘制工具实例
      mouseToolRef.current = new AMap.MouseTool(map.current);
      // 初始化多边形编辑实例
      polygonEditorRef.current = new AMap.PolygonEditor(map.current);
      // 初始化圆编辑实例
      circleEditorRef.current = new AMap.CircleEditor(map.current);

      if (onCreateRef.current) {
        onCreateRef.current({
          map: map.current!,
          polygonEditor: polygonEditorRef.current,
          polygon: polygonRef.current,
          circleEditor: circleEditorRef.current,
          circle: circleRef.current,
          tipMessageText: tipMessageTextRef.current!,
        });
      }

      map.current?.on('complete', () => {
        setFirstInitMapOver(true);
      });

      return () => {
        map.current?.destroy();
      };
    }, []);

    /**
     * esc退出绘制
     */
    useEffect(() => {
      // 监听esc按键事件
      if (openEscCancel) {
        const keydown = (e: any) => {
          if (e.key === 'Escape' && onDrawCancelRef.current) {
            onDrawCancelRef.current();
            changeTipMessageText(tipMessage);
          }
        };
        document.addEventListener('keydown', keydown);

        return () => {
          document.removeEventListener('keydown', keydown);
        };
      }

      return () => {};
    }, [openEscCancel, tipMessage]);

    /**
     * 鼠标移动时改变tipMessageTextRef的位置
     */
    useEffect(() => {
      // 鼠标移动时，改变text位置
      const mousemove = (e: any) => {
        tipMessageTextRef.current?.setPosition(e.lnglat);
        if (tipMessageStrRef.current) {
          tipMessageTextRef.current?.show();
        } else {
          tipMessageTextRef.current?.hide();
        }
      };
      // 鼠标移出地图时，隐藏此text
      const mouseout = () => {
        tipMessageTextRef.current?.hide();
      };
      // 鼠标移入地图时，展示text
      const mouseover = () => {
        if (tipMessageStrRef.current) {
          tipMessageTextRef.current?.show();
        } else {
          tipMessageTextRef.current?.hide();
        }
      };
      map.current?.on('mousemove', mousemove);
      map.current?.on('mouseout', mouseout);
      map.current?.on('mouseover', mouseover);

      return () => {
        map.current?.off('mousemove', mousemove);
        map.current?.off('mouseout', mouseout);
        map.current?.off('mouseover', mouseover);
        tipMessageTextRef.current?.hide();
      };
    }, []);

    /**
     * 设置当前地图应该显示的提示信息
     */
    useEffect(() => {
      switch (status) {
        case Status.NORMAL:
          changeTipMessageText(tipMessage);
          break;
        case Status.DRAW:
          changeTipMessageText(drawTipMessage);
          break;
        case Status.EDIT:
          changeTipMessageText(editTipMessage);
          break;

        default:
          break;
      }
    }, [drawTipMessage, editTipMessage, status, tipMessage]);

    /**
     * 开启绘制(多边形)
     */
    useEffect(() => {
      if (drawType === 'polygon') {
        const path: AMap.LngLat[] = [];
        let movePoint: AMap.LngLat;
        let editorEventList: any[] = [];
        // 点击添加点
        const click = (e: any) => {
          path.push(e.lnglat);
          if (!polygonRef.current) {
            polygonRef.current = new AMap.Polygon({
              path,
              bubble: true,
            });
            map.current?.add(polygonRef.current!);
          } else {
            polygonRef.current.setPath(path);
          }
          checkPolygon(path);
        };
        // 跟随鼠标移动下一个点
        const drawWhenMove = (e: any) => {
          movePoint = e.lnglat;
          if (polygonRef.current) {
            polygonRef.current.setPath([...path, movePoint]);
          }
        };
        // 右击撤销上一个点
        const rightClick = () => {
          if (polygonRef.current) {
            path.pop();
            polygonRef.current.setPath([...path, movePoint]);
            checkPolygon(path);
          }
        };
        // 关闭当前map监听的绘制事件
        const offMapListener = () => {
          map.current?.off('click', click);
          map.current?.off('mousemove', drawWhenMove);
          map.current?.off('rightclick', rightClick);
          map.current?.off('dblclick', doubleClick);
        };
        // 双击完成绘制，并进入编辑状态
        const doubleClick = () => {
          if (path.length < 3) {
            alert('至少需要3个点!');
            return;
          }
          if (polygonRef.current) {
            setStatus(Status.EDIT);
            // 关闭地图监听的事件
            offMapListener();
            // 生成 添加/删除 按钮
            const generatePolygonBtn = () => {
              // 找到最左边的点
              const path1 = polygonRef.current?.getPath() as AMap.LngLat[];
              path1?.sort((a: AMap.LngLat, b: AMap.LngLat) => {
                return a.getLng() - b.getLng();
              });
              const leftPoint = path1 && path1[0];
              generateBtn(leftPoint);
            };
            generatePolygonBtn();
            // 编辑多边形
            polygonEditorRef.current.setTarget(polygonRef.current);
            // 设置多边形吸附
            polygonEditorRef.current.setAdsorbPolygons(
              map.current?.getAllOverlays('polygon')
            );
            polygonEditorRef.current.open();

            const editorEventKeyList = [
              'addnode',
              'removenode',
              'adjust',
              'move',
              'add',
              'end',
            ];

            editorEventList = editorEventKeyList.map(event => {
              const listener = () => {
                generatePolygonBtn();
                if (event === 'end') {
                  if (onDrawCancelRef.current) {
                    onDrawCancelRef.current();
                  }
                } else {
                  checkPolygon(polygonRef.current?.getPath() as AMap.LngLat[]);
                }
              };
              polygonEditorRef.current.on(event, listener);
              return {
                event,
                listener,
              };
            });
          }
        };
        // 关闭PolygonEditor以及监听事件，同时删除当前绘制/编辑的板块
        const offEditorListener = () => {
          editorEventList.forEach(v => {
            polygonEditorRef.current.off(v.event, v.listener);
          });
        };

        // 读取所有的overlay信息
        let backOverlayBubble: any;
        if (draw === true) {
          // 记录overlay本身的bubble信息到extData，并设置overlay的bubble为true
          backOverlayBubble = allOverlayBubbleChange();
          // 设置提示信息 以及 监听事件等。。。
          setStatus(Status.DRAW);
          map.current?.setStatus({
            doubleClickZoom: false,
          });
          map.current?.setDefaultCursor('crosshair');
          map.current?.on('click', click);
          map.current?.on('mousemove', drawWhenMove);
          map.current?.on('rightclick', rightClick);
          map.current?.on('dblclick', doubleClick);

          return () => {
            // 开启地图双击放大
            map.current?.setStatus({
              doubleClickZoom: true,
            });
            // 鼠标样式为auto
            map.current?.setDefaultCursor('auto');
            // 关闭当前绘制相关的监听
            offMapListener();
            // 移除所有编辑相关的监听
            offEditorListener();
            // 移除添加保存marker
            if (addAndRemoveMarkerRef.current) {
              map.current?.remove(addAndRemoveMarkerRef.current);
            }
            // 设置添加保存container为undefined
            setAddAndRemoveBtnContainer(undefined);
            // 设置状态
            setStatus(Status.NORMAL);
            // 设置所有的overlay的bubble为其本身的bubble
            backOverlayBubble();
            // 销毁多边形
            if (polygonRef.current) {
              map.current?.remove(polygonRef.current);
              polygonRef.current = undefined;
            }
            // 关闭编辑
            polygonEditorRef.current.close();
            polygonEditorRef.current.setTarget();
          };
        }
      }

      return () => {};
    }, [checkPolygon, draw, drawType]);

    /**
     * 绘制圆
     */
    useEffect(() => {
      if (drawType === 'circle' && draw) {
        changeTipMessageText('点击选择中心点');
        map.current?.setStatus({
          doubleClickZoom: false,
        });

        let backBubble: any;
        const mousemove = (e: any) => {
          const distance = e.lnglat.distance(circleRef.current?.getCenter());
          circleRef.current?.setRadius(distance);
        };

        const addAllEditorListener = () => {
          const eventKeys = ['addnode', 'adjust', 'move', 'add', 'end'];
          const listeners = eventKeys.map(eventKey => {
            const event = () => {
              if (eventKey === 'move') {
                generateBtn(circleRef.current!.getCenter());
              }
            };
            circleEditorRef.current.on(eventKey, event);
            return {
              eventKey,
              event,
            };
          });

          return () => {
            listeners.forEach(v => {
              circleEditorRef.current.off(v.eventKey, v.event);
            });
          };
        };

        let removeEditorLisenter: any;
        const dblclick = () => {
          generateBtn(circleRef.current!.getCenter());
          map.current?.off('mousemove', mousemove);
          map.current?.off('dblclick', dblclick);

          circleEditorRef.current.setTarget(circleRef.current);
          circleEditorRef.current.open();
          removeEditorLisenter = addAllEditorListener();
          changeTipMessageText('拖动中心点进行移动\n拖动边缘点缩放半径');
        };
        const click = (e: any) => {
          circleRef.current = new AMap.Circle({
            center: e.lnglat,
          });
          map.current?.add(circleRef.current!);
          map.current?.off('click', click);
          map.current?.on('mousemove', mousemove);
          map.current?.on('dblclick', dblclick);
          backBubble = allOverlayBubbleChange();
        };
        map.current?.on('click', click);

        return () => {
          map.current?.off('click', click);
          map.current?.off('mousemove', mousemove);
          map.current?.off('dblclick', mousemove);
          backBubble && backBubble();
          map.current?.setStatus({
            doubleClickZoom: true,
          });
          if (removeEditorLisenter) {
            removeEditorLisenter();
          }
          // 移除添加保存marker
          if (addAndRemoveMarkerRef.current) {
            map.current?.remove(addAndRemoveMarkerRef.current);
          }
          // 移除circle
          if (circleRef.current) {
            map.current?.remove(circleRef.current);
            circleRef.current = undefined;
          }
          // 关闭编辑
          circleEditorRef.current.close();
          circleEditorRef.current.setTarget();
        };
      }

      return () => {};
    }, [drawType, draw]);

    return (
      <>
        <div style={style} className="yz-amap-container">
          <div
            id={defaultIdRef.current}
            style={{ height: '100%', width: '100%' }}
          />
          <div className="yz-amap-left-top">{leftTop}</div>
          <div className="yz-amap-right-top">{rightTop}</div>
          <div className="yz-amap-left-bottom">{leftBottom}</div>
          <div className="yz-amap-right-bottom">
            {rightBottom}
            {firstInitMapOver && mapType && (
              <MapType.default
                map={map.current}
                value={mapType}
                onChange={onMapTypeChange}
                dataSource={mapTypeDataSource}
              />
            )}
          </div>
        </div>

        <AddAndRemoveBtn
          container={addAndRemoveBtnContainer}
          onAddClick={onMyAddClick}
          showAdd={showAdd}
          onRemoveClick={onMyRemoveClick}
          showRemove={showRemove}
        />
      </>
    );
  }
);

YzAMap.displayName = 'YzAMap';
YzAMap.YzAMapUtils = YzAMapUtils;
YzAMap.Search = Search;
YzAMap.OverlayEditor = OverlayEditor;
YzAMap.AddAndRemoveBtn = AddAndRemoveBtn;

export default YzAMap as YzAMapFinallComponent;
