/**
 * Copyright 2015 The AMP HTML Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {BaseElement} from '../../src/base-element';
import {ElementStub} from '../../src/element-stub';
import {LOADING_ELEMENTS_, Layout} from '../../src/layout';
import {createAmpElementProto} from '../../src/custom-element';
import {resourcesFor} from '../../src/resources';
import {vsync} from '../../src/vsync';
import * as sinon from 'sinon';


describe('CustomElement', () => {

  let resources = resourcesFor(window);
  let testElementCreatedCallback;
  let testElementFirstAttachedCallback;
  let testElementBuildCallback;
  let testElementLayoutCallback;
  let testElementFirstLayoutCompleted;
  let testElementViewportCallback;
  let testElementDocumentInactiveCallback;
  let testElementIsReadyToBuild = true;

  class TestElement extends BaseElement {
    isLayoutSupported(layout) {
      return true;
    }
    createdCallback() {
      testElementCreatedCallback();
    }
    firstAttachedCallback() {
      testElementFirstAttachedCallback();
    }
    isReadyToBuild() {
      return testElementIsReadyToBuild;
    }
    buildCallback() {
      testElementBuildCallback();
    }
    layoutCallback() {
      testElementLayoutCallback();
      return Promise.resolve();
    }
    firstLayoutCompleted() {
      testElementFirstLayoutCompleted();
    }
    viewportCallback(inViewport) {
      testElementViewportCallback(inViewport);
    }
    documentInactiveCallback() {
      testElementDocumentInactiveCallback();
      return true;
    }
  }

  let ElementClass = document.registerElement('amp-test', {
    prototype: createAmpElementProto(window, 'amp-test', TestElement)
  });

  let StubElementClass = document.registerElement('amp-stub', {
    prototype: createAmpElementProto(window, 'amp-stub', ElementStub)
  });

  let sandbox;
  let resourcesMock;
  let clock;

  beforeEach(() => {
    sandbox = sinon.sandbox.create();
    resourcesMock = sandbox.mock(resources);
    clock = sandbox.useFakeTimers();

    testElementCreatedCallback = sinon.spy();
    testElementFirstAttachedCallback = sinon.spy();
    testElementBuildCallback = sinon.spy();
    testElementLayoutCallback = sinon.spy();
    testElementFirstLayoutCompleted = sinon.spy();
    testElementViewportCallback = sinon.spy();
    testElementDocumentInactiveCallback = sinon.spy();
  });

  afterEach(() => {
    resourcesMock.verify();
    resourcesMock.restore();
    resourcesMock = null;
    clock.restore();
    sandbox.restore();
    sandbox = null;
  });


  it('Element - createdCallback', () => {
    let element = new ElementClass();
    expect(element.classList.contains('-amp-element')).to.equal(true);
    expect(element.isBuilt()).to.equal(false);
    expect(element.classList.contains('-amp-notbuilt')).to.equal(true);
    expect(element.classList.contains('amp-notbuilt')).to.equal(true);
    expect(element.isUpgraded()).to.equal(true);
    expect(element.readyState).to.equal('loading');
    expect(element.everAttached).to.equal(false);
    expect(element.layout_).to.equal(Layout.NODISPLAY);
    expect(testElementCreatedCallback.callCount).to.equal(1);
  });

  it('StubElement - createdCallback', () => {
    let element = new StubElementClass();
    expect(element.classList.contains('-amp-element')).to.equal(true);
    expect(element.isBuilt()).to.equal(false);
    expect(element.classList.contains('-amp-notbuilt')).to.equal(true);
    expect(element.classList.contains('amp-notbuilt')).to.equal(true);
    expect(element.isUpgraded()).to.equal(false);
    expect(element.readyState).to.equal('loading');
    expect(element.everAttached).to.equal(false);
    expect(element.layout_).to.equal(Layout.NODISPLAY);
    expect(testElementCreatedCallback.callCount).to.equal(0);
  });


  it('Element - updateLayoutBox', () => {
    let element = new ElementClass();
    expect(element.layoutWidth_).to.equal(-1);
    expect(element.implementation_.layoutWidth_).to.equal(-1);

    element.updateLayoutBox({top: 0, left: 0, width: 111, height: 51});
    expect(element.layoutWidth_).to.equal(111);
    expect(element.implementation_.layoutWidth_).to.equal(111);
  });

  it('StubElement - upgrade', () => {
    let element = new StubElementClass();
    expect(element.isUpgraded()).to.equal(false);
    expect(testElementCreatedCallback.callCount).to.equal(0);

    element.layout_ = Layout.FILL;
    element.updateLayoutBox({top: 0, left: 0, width: 111, height: 51});
    resourcesMock.expects('upgraded').withExactArgs(element).once();

    element.upgrade(TestElement);

    expect(element.isUpgraded()).to.equal(true);
    expect(element.implementation_ instanceof TestElement).to.equal(true);
    expect(element.implementation_.layout_).to.equal(Layout.FILL);
    expect(element.implementation_.layoutWidth_).to.equal(111);
    expect(testElementCreatedCallback.callCount).to.equal(1);
    expect(testElementFirstAttachedCallback.callCount).to.equal(0);
    expect(element.isBuilt()).to.equal(false);
  });


  it('Element - build allowed', () => {
    let element = new ElementClass();
    expect(element.classList.contains('-amp-element')).to.equal(true);
    expect(element.isBuilt()).to.equal(false);
    expect(element.classList.contains('-amp-notbuilt')).to.equal(true);
    expect(element.classList.contains('amp-notbuilt')).to.equal(true);
    expect(testElementBuildCallback.callCount).to.equal(0);

    testElementIsReadyToBuild = true;
    element.build(false);

    expect(element.isBuilt()).to.equal(true);
    expect(element.classList.contains('-amp-notbuilt')).to.equal(false);
    expect(element.classList.contains('amp-notbuilt')).to.equal(false);
    expect(testElementBuildCallback.callCount).to.equal(1);
  });

  it('Element - buildCallback cannot be called twice', () => {
    let element = new ElementClass();
    expect(element.isBuilt()).to.equal(false);
    expect(testElementBuildCallback.callCount).to.equal(0);

    testElementIsReadyToBuild = true;
    let res = element.build(false);
    expect(res).to.equal(true);
    expect(element.isBuilt()).to.equal(true);
    expect(testElementBuildCallback.callCount).to.equal(1);

    // Call again.
    res = element.build(false);
    expect(res).to.equal(true);
    expect(element.isBuilt()).to.equal(true);
    expect(testElementBuildCallback.callCount).to.equal(1);
  });

  it('Element - build not allowed', () => {
    let element = new ElementClass();
    expect(element.classList.contains('-amp-element')).to.equal(true);
    expect(element.isBuilt()).to.equal(false);
    expect(element.classList.contains('-amp-notbuilt')).to.equal(true);
    expect(element.classList.contains('amp-notbuilt')).to.equal(true);
    expect(testElementBuildCallback.callCount).to.equal(0);

    testElementIsReadyToBuild = false;
    element.build(false);

    expect(element.isBuilt()).to.equal(false);
    expect(element.classList.contains('-amp-notbuilt')).to.equal(true);
    expect(element.classList.contains('amp-notbuilt')).to.equal(true);
    expect(testElementBuildCallback.callCount).to.equal(0);
  });

  it('Element - build not allowed but forced', () => {
    let element = new ElementClass();
    expect(element.classList.contains('-amp-element')).to.equal(true);
    expect(element.isBuilt()).to.equal(false);
    expect(element.classList.contains('-amp-notbuilt')).to.equal(true);
    expect(element.classList.contains('amp-notbuilt')).to.equal(true);
    expect(testElementBuildCallback.callCount).to.equal(0);

    testElementIsReadyToBuild = false;
    element.build(true);

    expect(element.isBuilt()).to.equal(true);
    expect(element.classList.contains('-amp-notbuilt')).to.equal(false);
    expect(element.classList.contains('amp-notbuilt')).to.equal(false);
    expect(testElementBuildCallback.callCount).to.equal(1);
  });

  it('StubElement - build never allowed', () => {
    let element = new StubElementClass();
    expect(element.classList.contains('-amp-element')).to.equal(true);
    expect(element.isBuilt()).to.equal(false);
    expect(element.classList.contains('-amp-notbuilt')).to.equal(true);
    expect(element.classList.contains('amp-notbuilt')).to.equal(true);
    expect(testElementBuildCallback.callCount).to.equal(0);

    expect(() => {
      element.build(true);
    }).to.throw(/Cannot build unupgraded element/);

    expect(element.isBuilt()).to.equal(false);
    expect(testElementBuildCallback.callCount).to.equal(0);
  });


  it('Element - attachedCallback', () => {
    let element = new ElementClass();
    element.setAttribute('layout', 'fill');
    expect(testElementFirstAttachedCallback.callCount).to.equal(0);
    expect(element.everAttached).to.equal(false);
    expect(element.layout_).to.equal(Layout.NODISPLAY);

    resourcesMock.expects('add').withExactArgs(element).once();
    element.attachedCallback();

    expect(element.everAttached).to.equal(true);
    expect(element.layout_).to.equal(Layout.FILL);
    expect(element.implementation_.layout_).to.equal(Layout.FILL);
    expect(testElementFirstAttachedCallback.callCount).to.equal(1);
  });

  it('StubElement - attachedCallback', () => {
    let element = new StubElementClass();
    element.setAttribute('layout', 'fill');
    expect(testElementFirstAttachedCallback.callCount).to.equal(0);
    expect(element.everAttached).to.equal(false);
    expect(element.layout_).to.equal(Layout.NODISPLAY);

    resourcesMock.expects('add').withExactArgs(element).once();
    element.attachedCallback();

    expect(element.everAttached).to.equal(true);
    expect(element.layout_).to.equal(Layout.FILL);
    expect(element.implementation_.layout_).to.equal(Layout.FILL);
    // Not upgraded yet!
    expect(testElementCreatedCallback.callCount).to.equal(0);
    expect(testElementFirstAttachedCallback.callCount).to.equal(0);

    // Upgrade
    resourcesMock.expects('upgraded').withExactArgs(element).once();
    element.upgrade(TestElement);

    expect(element.layout_).to.equal(Layout.FILL);
    expect(element.implementation_.layout_).to.equal(Layout.FILL);
    // Now it's called.
    expect(testElementCreatedCallback.callCount).to.equal(1);
    expect(testElementFirstAttachedCallback.callCount).to.equal(1);
  });

  it('Element - detachedCallback', () => {
    let element = new ElementClass();
    element.setAttribute('layout', 'fill');
    expect(testElementFirstAttachedCallback.callCount).to.equal(0);
    expect(element.everAttached).to.equal(false);
    expect(element.layout_).to.equal(Layout.NODISPLAY);

    resourcesMock.expects('add').withExactArgs(element).once();
    element.attachedCallback();

    resourcesMock.expects('remove').withExactArgs(element).once();
    element.detachedCallback();

    expect(element.everAttached).to.equal(true);
    expect(element.layout_).to.equal(Layout.FILL);
    expect(element.implementation_.layout_).to.equal(Layout.FILL);
    expect(testElementFirstAttachedCallback.callCount).to.equal(1);
  });


  it('Element - layoutCallback before build', () => {
    let element = new ElementClass();
    element.setAttribute('layout', 'fill');
    expect(testElementLayoutCallback.callCount).to.equal(0);

    expect(element.isBuilt()).to.equal(false);
    expect(() => {
      element.layoutCallback();
    }).to.throw(/Must be upgraded and built to receive viewport events/);

    expect(testElementLayoutCallback.callCount).to.equal(0);
  });

  it('StubElement - layoutCallback before build or upgrade', () => {
    let element = new StubElementClass();
    element.setAttribute('layout', 'fill');
    expect(testElementLayoutCallback.callCount).to.equal(0);

    expect(element.isUpgraded()).to.equal(false);
    expect(element.isBuilt()).to.equal(false);
    expect(() => {
      element.layoutCallback();
    }).to.throw(/Must be upgraded and built to receive viewport events/);

    resourcesMock.expects('upgraded').withExactArgs(element).once();
    element.upgrade(TestElement);

    expect(element.isUpgraded()).to.equal(true);
    expect(element.isBuilt()).to.equal(false);
    expect(() => {
      element.layoutCallback();
    }).to.throw(/Must be upgraded and built to receive viewport events/);

    expect(testElementLayoutCallback.callCount).to.equal(0);
  });

  it('Element - layoutCallback', () => {
    let element = new ElementClass();
    element.setAttribute('layout', 'fill');
    element.build(true);
    expect(element.isBuilt()).to.equal(true);
    expect(testElementLayoutCallback.callCount).to.equal(0);

    let p = element.layoutCallback();
    expect(testElementLayoutCallback.callCount).to.equal(1);
    return p.then(() => {
      expect(element.readyState).to.equal('complete');
    });
  });

  it('Element - layoutCallback should call firstLayoutCompleted only once',
      () => {
        let element = new ElementClass();
        element.setAttribute('layout', 'fill');
        element.build(true);

        let p = element.layoutCallback();
        expect(testElementLayoutCallback.callCount).to.equal(1);
        expect(testElementFirstLayoutCompleted.callCount).to.equal(0);
        return p.then(() => {
          expect(testElementFirstLayoutCompleted.callCount).to.equal(1);

      // But not second time.
          let p2 = element.layoutCallback();
          expect(testElementLayoutCallback.callCount).to.equal(2);
          expect(testElementFirstLayoutCompleted.callCount).to.equal(1);
          return p2.then(() => {
            expect(testElementFirstLayoutCompleted.callCount).to.equal(1);
          });
        });
      });

  it('StubElement - layoutCallback', () => {
    let element = new StubElementClass();
    element.setAttribute('layout', 'fill');
    resourcesMock.expects('upgraded').withExactArgs(element).once();
    element.upgrade(TestElement);
    element.build(true);
    expect(element.isUpgraded()).to.equal(true);
    expect(element.isBuilt()).to.equal(true);
    expect(testElementLayoutCallback.callCount).to.equal(0);

    let p = element.layoutCallback();
    expect(testElementLayoutCallback.callCount).to.equal(1);
    return p.then(() => {
      expect(element.readyState).to.equal('complete');
    });
  });


  it('should enqueue actions until built', () => {
    let element = new ElementClass();
    let handler = sinon.spy();
    element.implementation_.executeAction = handler;
    expect(element.actionQueue_).to.not.equal(null);

    let inv = {};
    element.enqueAction(inv);
    expect(element.actionQueue_.length).to.equal(1);
    expect(element.actionQueue_[0]).to.equal(inv);
    expect(handler.callCount).to.equal(0);
  });

  it('should execute action immediately after built', () => {
    let element = new ElementClass();
    let handler = sinon.spy();
    element.implementation_.executeAction = handler;
    element.build(true);

    let inv = {};
    element.enqueAction(inv);
    expect(handler.callCount).to.equal(1);
    expect(handler.getCall(0).args[0]).to.equal(inv);
    expect(handler.getCall(0).args[1]).to.equal(false);
  });

  it('should dequeue all actions after build', () => {
    let element = new ElementClass();
    let handler = sinon.spy();
    element.implementation_.executeAction = handler;

    let inv1 = {};
    let inv2 = {};
    element.enqueAction(inv1);
    element.enqueAction(inv2);
    expect(element.actionQueue_.length).to.equal(2);
    expect(element.actionQueue_[0]).to.equal(inv1);
    expect(element.actionQueue_[1]).to.equal(inv2);
    expect(handler.callCount).to.equal(0);

    element.build(true);
    clock.tick(10);
    expect(handler.callCount).to.equal(2);
    expect(handler.getCall(0).args[0]).to.equal(inv1);
    expect(handler.getCall(0).args[1]).to.equal(true);
    expect(handler.getCall(1).args[0]).to.equal(inv2);
    expect(handler.getCall(1).args[1]).to.equal(true);
    expect(element.actionQueue_).to.equal(null);
  });


  it('should apply media condition', () => {
    let element1 = new ElementClass();
    element1.setAttribute('media', '(min-width: 1px)');
    element1.applySizesAndMediaQuery();
    expect(element1).to.not.have.class('-amp-hidden-by-media-query');

    let element2 = new ElementClass();
    element2.setAttribute('media', '(min-width: 1111111px)');
    element2.applySizesAndMediaQuery();
    expect(element2).to.have.class('-amp-hidden-by-media-query');
  });

  it('should apply sizes condition', () => {
    let element1 = new ElementClass();
    element1.setAttribute('sizes', '(min-width: 1px) 200px, 50vw');
    element1.applySizesAndMediaQuery();
    expect(element1.style.width).to.equal('200px');

    let element2 = new ElementClass();
    element2.setAttribute('sizes', '(min-width: 1111111px) 200px, 50vw');
    element2.applySizesAndMediaQuery();
    expect(element2.style.width).to.equal('50vw');
  });

  it('should change height without sizer', () => {
    let element = new ElementClass();
    element.changeHeight(111);
    expect(element.style.height).to.equal('111px');
  });

  it('should change height with sizer', () => {
    let element = new ElementClass();
    element.sizerElement_ = document.createElement('div');
    element.changeHeight(111);
    expect(element.sizerElement_.style.paddingTop).to.equal('111px');
    expect(element.style.height).to.equal('');
  });


  it('Element - documentInactiveCallback', () => {
    let element = new ElementClass();

    // Non-built element doesn't receive documentInactiveCallback.
    element.documentInactiveCallback();
    expect(testElementDocumentInactiveCallback.callCount).to.equal(0);

    // Built element receives documentInactiveCallback.
    element.build(true);
    element.documentInactiveCallback();
    expect(testElementDocumentInactiveCallback.callCount).to.equal(1);
  });

  it('StubElement - documentInactiveCallback', () => {
    let element = new StubElementClass();

    // Unupgraded document doesn't receive documentInactiveCallback.
    element.documentInactiveCallback();
    expect(testElementDocumentInactiveCallback.callCount).to.equal(0);
  });

  describe('viewportCallback', () => {
    it('Element should allow, but not delegate before build', () => {
      let element = new ElementClass();
      element.setAttribute('layout', 'fill');
      expect(testElementViewportCallback.callCount).to.equal(0);

      expect(element.isBuilt()).to.equal(false);
      element.viewportCallback(true);
      expect(element.isInViewport_).to.equal(true);
      expect(testElementViewportCallback.callCount).to.equal(0);
    });

    it('StubElement - should not delegate before build or upgrade', () => {
      let element = new StubElementClass();
      element.setAttribute('layout', 'fill');
      expect(testElementViewportCallback.callCount).to.equal(0);

      expect(element.isUpgraded()).to.equal(false);
      expect(element.isBuilt()).to.equal(false);
      element.viewportCallback(true);
      expect(element.isInViewport_).to.equal(true);
      expect(testElementViewportCallback.callCount).to.equal(0);

      resourcesMock.expects('upgraded').withExactArgs(element).once();
      element.upgrade(TestElement);

      expect(element.isUpgraded()).to.equal(true);
      expect(element.isBuilt()).to.equal(false);
      element.viewportCallback(false);
      expect(element.isInViewport_).to.equal(false);
      expect(testElementViewportCallback.callCount).to.equal(0);
    });

    it('Element - should be called once built', () => {
      let element = new ElementClass();
      element.setAttribute('layout', 'fill');
      element.build(true);
      expect(element.isBuilt()).to.equal(true);
      expect(testElementViewportCallback.callCount).to.equal(0);

      element.viewportCallback(true);
      expect(element.implementation_.inViewport_).to.equal(true);
      expect(testElementViewportCallback.callCount).to.equal(1);
    });

    it('StubElement - should be called once upgraded', () => {
      let element = new StubElementClass();
      element.setAttribute('layout', 'fill');
      resourcesMock.expects('upgraded').withExactArgs(element).once();
      element.upgrade(TestElement);
      element.build(true);
      expect(element.isUpgraded()).to.equal(true);
      expect(element.isBuilt()).to.equal(true);
      expect(testElementViewportCallback.callCount).to.equal(0);

      element.viewportCallback(true);
      expect(element.implementation_.inViewport_).to.equal(true);
      expect(testElementViewportCallback.callCount).to.equal(1);
    });

    it('Element - should be called on built if in viewport', () => {
      let element = new ElementClass();
      element.setAttribute('layout', 'fill');
      element.viewportCallback(true);
      expect(element.isInViewport_).to.equal(true);
      expect(testElementViewportCallback.callCount).to.equal(0);

      element.build(true);
      expect(element.isBuilt()).to.equal(true);
      expect(testElementViewportCallback.callCount).to.equal(1);
    });
  });
});


describe('CustomElement Service Elements', () => {

  let StubElementClass = document.registerElement('amp-stub2', {
    prototype: createAmpElementProto(window, 'amp-stub2', ElementStub)
  });

  let sandbox;
  let element;

  beforeEach(() => {
    sandbox = sinon.sandbox.create();
    element = new StubElementClass();
  });

  afterEach(() => {
    sandbox.restore();
    sandbox = null;
  });

  function createWithAttr(attr) {
    let child = document.createElement('div');
    child.setAttribute(attr, '');
    return child;
  }

  it('getRealChildren should return nothign', () => {
    expect(element.getRealChildNodes().length).to.equal(0);
    expect(element.getRealChildren().length).to.equal(0);
  });

  it('getRealChildren should return content-only nodes', () => {
    element.appendChild(document.createElement('i-amp-service'));
    element.appendChild(createWithAttr('placeholder'));
    element.appendChild(createWithAttr('fallback'));
    element.appendChild(document.createTextNode('abc'));
    element.appendChild(document.createElement('content'));

    let nodes = element.getRealChildNodes();
    expect(nodes.length).to.equal(2);
    expect(nodes[0].textContent).to.equal('abc');
    expect(nodes[1].tagName.toLowerCase()).to.equal('content');

    let elements = element.getRealChildren();
    expect(elements.length).to.equal(1);
    expect(elements[0].tagName.toLowerCase()).to.equal('content');
  });


  it('getPlaceholder should return nothing', () => {
    expect(element.getPlaceholder()).to.be.null;
  });

  it('getPlaceholder should return the first placeholder', () => {
    let placeholder1 = element.appendChild(createWithAttr('placeholder'));
    let placeholder2 = element.appendChild(createWithAttr('placeholder'));
    expect(element.getPlaceholder()).to.equal(placeholder1);
  });

  it('togglePlaceholder should do nothing when no placeholder is found', () => {
    expect(element.getPlaceholder()).to.be.null;
    element.togglePlaceholder(false);
  });

  it('togglePlaceholder should do hide placeholder when found', () => {
    let placeholder1 = element.appendChild(createWithAttr('placeholder'));
    let placeholder2 = element.appendChild(createWithAttr('placeholder'));
    element.togglePlaceholder(false);
    expect(placeholder1).to.have.class('amp-hidden');
    expect(placeholder2).to.not.have.class('amp-hidden');

    element.togglePlaceholder(true);
    expect(placeholder1).to.not.have.class('amp-hidden');
  });

  it('toggleFallback should toggle unsupported class', () => {
    element.toggleFallback(true);
    expect(element).to.have.class('amp-notsupported');

    element.toggleFallback(false);
    expect(element).to.not.have.class('amp-notsupported');
  });
});


describe('CustomElement Loading Indicator', () => {

  class TestElement extends BaseElement {
  }
  let ElementClass = document.registerElement('amp-test2', {
    prototype: createAmpElementProto(window, 'amp-test2', TestElement)
  });

  let resources = resourcesFor(window);
  let sandbox;
  let clock;
  let element;
  let savedMutate;
  let vsyncTasks;
  let resourcesMock;

  beforeEach(() => {
    LOADING_ELEMENTS_['amp-test2'.toUpperCase()] = true;
    sandbox = sinon.sandbox.create();
    clock = sandbox.useFakeTimers();
    resourcesMock = sandbox.mock(resources);
    element = new ElementClass();
    element.layoutWidth_ = 300;
    element.layout_ = Layout.FIXED;
    savedMutate = vsync.mutate;
    vsyncTasks = [];
    vsync.mutate = mutator => {
      vsyncTasks.push(mutator);
    };
  });

  afterEach(() => {
    vsync.mutate = savedMutate;
    resourcesMock.verify();
    resourcesMock.restore();
    clock.restore();
    sandbox.restore();
    sandbox = null;
  });


  it('should be enabled by default', () => {
    expect(element.isLoadingEnabled_()).to.be.true;
  });

  it('should disable when explicitly disabled by the attribute', () => {
    element.setAttribute('noloading', '');
    expect(element.isLoadingEnabled_()).to.be.false;
  });

  it('should disable when element is not whitelisted', () => {
    LOADING_ELEMENTS_['amp-test2'.toUpperCase()] = false;
    expect(element.isLoadingEnabled_()).to.be.false;
  });

  it('should disable when not measured or too small', () => {
    element.layoutWidth_ = 0;
    expect(element.isLoadingEnabled_()).to.be.false;

    element.layoutWidth_ = 10;
    expect(element.isLoadingEnabled_()).to.be.false;
  });

  it('should disable when element has already been laid out', () => {
    element.layoutCount_ = 1;
    expect(element.isLoadingEnabled_()).to.be.false;
  });

  it('should disable when element is a placeholder itself', () => {
    element.setAttribute('placeholder', '');
    expect(element.isLoadingEnabled_()).to.be.false;
  });

  it('should disable when element is not sized', () => {
    element.layout_ = Layout.CONTAINER;
    expect(element.isLoadingEnabled_()).to.be.false;

    element.layout_ = Layout.NODISPLAY;
    expect(element.isLoadingEnabled_()).to.be.false;
  });


  it('should ignore loading-off if never created', () => {
    element.toggleLoading_(false);
    expect(vsyncTasks).to.be.empty;
  });

  it('should ignore loading-on if not allowed', () => {
    element.setAttribute('noloading', '');
    element.toggleLoading_(true);
    expect(vsyncTasks).to.be.empty;
  });

  it('should create and turn on', () => {
    element.toggleLoading_(true);
    expect(vsyncTasks).to.have.length.of(1);

    vsyncTasks.shift()();
    expect(element.loadingContainer_).to.not.be.null;
    expect(element.loadingContainer_).to.not.have.class('amp-hidden');
    expect(element.loadingElement_).to.not.be.null;
    expect(element.loadingElement_).to.have.class('amp-active');
    expect(vsyncTasks).to.have.length.of(0);
  });

  it('should turn on already created', () => {
    element.prepareLoading_();
    let container = element.loadingContainer_;
    let indicator = element.loadingElement_;
    element.toggleLoading_(true);
    expect(vsyncTasks).to.have.length.of(1);

    vsyncTasks.shift()();
    expect(element.loadingContainer_).to.equal(container);
    expect(element.loadingContainer_).to.not.have.class('amp-hidden');
    expect(element.loadingElement_).to.equal(indicator);
    expect(element.loadingElement_).to.have.class('amp-active');
    expect(vsyncTasks).to.have.length.of(0);
  });

  it('should turn off', () => {
    element.prepareLoading_();
    element.toggleLoading_(false);
    expect(vsyncTasks).to.have.length.of(1);

    vsyncTasks.shift()();
    expect(element.loadingContainer_).to.not.be.null;
    expect(element.loadingContainer_).to.have.class('amp-hidden');
    expect(element.loadingElement_).to.not.be.null;
    expect(element.loadingElement_).to.not.have.class('amp-active');
    expect(vsyncTasks).to.have.length.of(0);
  });

  it('should turn off and cleanup', () => {
    element.prepareLoading_();
    resourcesMock.expects('deferMutate').once();
    element.toggleLoading_(false, true);

    expect(vsyncTasks).to.have.length.of(1);
    vsyncTasks.shift()();
    expect(element.loadingContainer_).to.be.null;
    expect(element.loadingElement_).to.be.null;
  });


  it('should turn off when exits viewport', () => {
    let toggle = sandbox.spy(element, 'toggleLoading_');
    element.viewportCallback(false);
    expect(toggle.callCount).to.equal(1);
    expect(toggle.firstCall.args[0]).to.equal(false);
    expect(toggle.firstCall.args[1]).to.be.undefined;
  });

  it('should NOT turn off when exits viewport but already laid out', () => {
    let toggle = sandbox.spy(element, 'toggleLoading_');
    element.layoutCount_ = 1;
    element.viewportCallback(false);
    expect(toggle.callCount).to.equal(0);
  });

  it('should turn on when enters viewport', () => {
    let toggle = sandbox.spy(element, 'toggleLoading_');
    element.viewportCallback(true);
    clock.tick(1000);
    expect(toggle.callCount).to.equal(1);
    expect(toggle.firstCall.args[0]).to.equal(true);
  });

  it('should NOT turn on when enters viewport but already laid out', () => {
    let toggle = sandbox.spy(element, 'toggleLoading_');
    element.layoutCount_ = 1;
    element.viewportCallback(true);
    clock.tick(1000);
    expect(toggle.callCount).to.equal(0);
  });


  it('should start loading when measured if already in viewport', () => {
    let toggle = sandbox.spy(element, 'toggleLoading_');
    element.isInViewport_ = true;
    element.updateLayoutBox({top: 0, width: 300});
    expect(toggle.callCount).to.equal(1);
    expect(toggle.firstCall.args[0]).to.equal(true);
  });

  it('should create loading when measured if in the top window', () => {
    let toggle = sandbox.spy(element, 'toggleLoading_');
    element.updateLayoutBox({top: 0, width: 300});
    expect(toggle.callCount).to.equal(0);
    expect(vsyncTasks).to.have.length.of(1);
    vsyncTasks.shift()();
    expect(element.loadingContainer_).to.not.be.null;
    expect(element.loadingContainer_).to.have.class('amp-hidden');
  });


  it('should toggle loading off after layout complete', () => {
    let toggle = sandbox.spy(element, 'toggleLoading_');
    element.build(true);
    return element.layoutCallback().then(() => {
      expect(toggle.callCount).to.equal(1);
      expect(toggle.firstCall.args[0]).to.equal(false);
      expect(toggle.firstCall.args[1]).to.equal(true);
    }, () => {
      throw new Error('Should never happen.');
    });
  });

  it('should toggle loading off after layout failed', () => {
    let toggle = sandbox.spy(element, 'toggleLoading_');
    let implMock = sandbox.mock(element.implementation_);
    implMock.expects('layoutCallback').returns(Promise.reject());
    element.build(true);
    return element.layoutCallback().then(() => {
      throw new Error('Should never happen.');
    }, () => {
      expect(toggle.callCount).to.equal(1);
      expect(toggle.firstCall.args[0]).to.equal(false);
      expect(toggle.firstCall.args[1]).to.equal(true);
    });
  });
});
