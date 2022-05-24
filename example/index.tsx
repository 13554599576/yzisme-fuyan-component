import 'react-app-polyfill/ie11';
import React, { useEffect, useRef, useState } from 'react';
import * as ReactDOM from 'react-dom';
import { YzAMap } from '../.';
import { OverlayItem } from '../dist/components/YzAMap/components/OverlayEditorItem';
import '@amap/amap-jsapi-types';
import { YzAMapRef } from '../dist/components/YzAMap';

const { AMap } = window;

const App = () => {
  const mapRef = useRef<AMap.Map>();
  const tipMessageTextRef = useRef<AMap.Text>();
  const [firstInitOver, setFirstInitOver] = useState(false);
  const [draw, setDraw] = useState(false);
  const [dataSource, setDataSource] = useState<OverlayItem[]>([]);

  const ref = useRef<YzAMapRef>(null);

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <YzAMap
        ref={ref}
        style={{ width: '100%', height: '100%' }}
        draw={draw}
        onCreate={({ map, tipMessageText }) => {
          mapRef.current = map;
          tipMessageTextRef.current = tipMessageText;
          setFirstInitOver(true);
        }}
        rightTop={
          <>
            <button onClick={() => setDraw(true)}>开启绘制</button>
            {firstInitOver && (
              <YzAMap.OverlayEditor
                dataSource={dataSource}
                onChange={setDataSource}
                style={{ marginTop: 8 }}
                map={mapRef.current!}
              />
            )}
          </>
        }
        onAddClick={overlay => {
          let newOverlay: typeof overlay;
          if (overlay instanceof AMap.Polygon) {
            newOverlay = new AMap.Polygon({
              path: overlay.getPath(),
            });
          } else {
            newOverlay = new AMap.Circle({
              center: overlay.getCenter(),
              radius: overlay.getRadius(),
            });
          }
          mapRef.current?.add(newOverlay);
          setDataSource(state => [
            ...state,
            {
              id: Math.random(),
              label: Math.random().toString(),
              value: newOverlay,
            },
          ]);
          setDraw(false);
        }}
        onRemoveClick={() => {
          setTimeout(() => {
            setDraw(false);
          });
        }}
        onDrawCancel={() => setDraw(false)}
      />
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById('root'));
