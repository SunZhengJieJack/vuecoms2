<template>
  <div class="u-query">
    <form @submit="handleSubmit">
    <template v-if="showSelected && selected.length>0">
      <Row class="selectedRow">
        <Col span="1">
          <span class="selectedText">已选:</span>
        </Col>
        <Col span="22">
          <Tag :class="'selectedTag'" v-for="s in selected" :key="s['name']" type="border" closable
              :name="s['name']"
              @on-close="handleTagClose">{{s['label']}}: {{s['value']}}
          </Tag>
        </Col>
      </Row>
      <div class="line"></div>
    </template>
    <!-- 生成单行条件 -->
    <Row v-if="!isShow && showLine === 1" class="u-layout-row" :style="firstLayoutStyle">
      <FormCell v-for="col in firstLayout" class="u-query-firstlayout"
        :col="col" 
        :value="current_value" 
        :staticSuffix="staticSuffix"
        :field-style="col.style"
        :compact="true"
        root="Query"
        ></FormCell>
      <Buttons :buttons="btns" :size="btnSize"></Buttons>
    </Row>
    <!-- 生成多行条件 -->
    <Row v-else v-for="(row, index) in getRows(rows)" class="u-layout-row" :key="index">
      <Col v-for="col in row" :span="col.colspan">
        <FormCell :col="col" :value="current_value" :staticSuffix="staticSuffix" :root="Query"></FormCell>
      </Col>
    </Row>
    <!-- 生成显示，隐藏线 -->
    <Row class="collapse-line" v-if="rows.length > 1 && showLine < rows.length">
      <span @click="isShow = !isShow" class="showMoreBtn">
        {{isShow ? "隐藏" : "显示"}}
        <Icon type="ios-arrow-up" v-show="isShow"></Icon>
        <Icon type="ios-arrow-down" v-show="!isShow"></Icon>
      </span>
    </Row>
    <!-- 生成查询按钮 -->
    <Row v-if="isShow || !isShow && showLine>1">
      <Col style="margin:5px; text-align:center" span="24">
        <Buttons :buttons="btns" :size="btnSize"></Buttons>
      </Col>
    </Row>
    </form>
  </div>
</template>

<script>
import {Form, Row, Col, Button, Tag, Icon} from "iview"
import Emitter from '../mixins/emitter.js'
import dict from '../mixins/dict.js'
import Buttons from '../Table/UButtons'
import {QueryURL, mapState, mapMethod, formatDate, isEmpty, deepCopy, reset, deepCompare} from "../utils/utils"
import GenericInput from '../Fields'
import FormCell from '../Build/FormCell'
import getField from '../Fields/fieldMapping'

export default {
  name: 'Query',
  props: {
    fields: {
      type: Array,
      default () {
        return []
      }
    },
    layout: {
      type: Array,
      requied: true
    },
    firstLineLayout: {
      type: Array,
      default () {
        return []
      }
    },
    labelWidth: {
      type: Number,
      default: 80
    },
    defaultValue: {
      type: Object,
      default () {
        return {}
      }
    },
    value: {
      type: Object,
      default () {
        return {}
      }
    },
    showLine: { // 当条件为多行时，初始显示几行，缺省为1
      type: Number,
      default: 1
    },
    choices: {
      type: Object,
      default () {
        return {}
      }
    },
    firstLayoutAlign: {
      default: 'left'
    },
    showSelected: {
      type: Boolean,
      default: false
    },
    staticSuffix: {
      type: String,
      default: '_static'
    },
    submitText: {
      type: String,
      default: '查询'
    },
    resetText: {
      type: String,
      default: '重置'
    },
    parseUrl: {
      type: Boolean,
      default: true
    },
    buttons: {
      type: Array,
      default () {
        return []
      }
    },
    btnSize: {
      default: 'default'
    }
  },
  mixins: [Emitter, dict],
  components: {
    Row, Col, FormCell, Button, Tag, Icon, GenericInput, Buttons
  },
  data(){
    let self = this
    let submitBtn = {label: this.submitText, htmlType: 'submit', type:'primary', name: 'submit', onClick (target, data, btn) {
        self.handleClick(btn)
      }
    }
    
    let resetBtn
    if (this.resetText) {
      resetBtn = {label: this.resetText, type:'default', name: 'reset', onClick (target, data, btn) {
        self.handleClick(btn)
      }}
    }

    let buttons = []

    if (this.buttons.length > 0) {
      for (let group of this.buttons) {
        let g = []
        buttons.push(g)
        for (let b of group) {
          if (b.name === 'submit') {
            g.push(Object.assign({}, submitBtn, b))
          }
          else if (b.name === 'reset' && resetBtn) {
            g.push(Object.assign({}, resetBtn, b))
          } else {
            g.push(b)
          }
        }
      }
    } else {
      buttons = [
        [submitBtn]
      ]
      if (resetBtn) {
        buttons.push([resetBtn])
      }
    }

    return {
      f: {},  // fields
      current_value: {},
      old_value: {}, //保存上一次的值,用于数据比较
      isShow: false, // 是否显示隐藏内容
      btns: buttons
    }
  },
  computed: {
    selected () {
      let v = []
      for (let row of this.layout) {
        for (let col of row) {
          if (typeof col === 'object') {
            name = col.name
          } else {
            name = col
          }

          let value
          let field = this.f[name]
          let InputClass = getField(field.type)
          let options = Object.assign({}, field, {value: this.value, staticSuffix: this.staticSuffix})
          let input = new InputClass(this, options)
          if (! isEmpty(this.value[name])) {
            //判断是否有name_static值，如果有，则不再执行setStaticValue的方法
            input.setStaticValue(this.value[name])
            v.push({name: name, label: field.label, 
              value: this.value[`${name}${this.staticSuffix}`] || this.value[name]})
          }
        }
      }
      return v
    },

    // 获取第一行的布局，可以单独设置style，如宽度 width
    firstLayout () {
      let fields = [], row
      if (this.firstLineLayout.length > 0) row = this.firstLineLayout
      else row = this.layout[0]
      for (let f of row) {
        let d = {}
        if (typeof f === 'string') {
          d.name = f
        } else {
          d = f
        }
        let col = this.f[d.name]
        if (!d.style) {
          d.style = {
            width: '200px',
          }
        }
        Object.assign(d, col)
        fields.push(d)
      }
      return fields
    },

    firstLayoutStyle () {
      return {'text-align': this.firstLayoutAlign}
    },

    rows () {
      let r = [], name
      for (let row of this.layout) {
        let new_r = []
        let span = 24 / row.length

        //重新计算col
        for (let col of row) {
          if (typeof col === 'object') {
            name = col.name
            span = col.colspan || span
          } else {
            name = col
          }
          let width = 100 / 24 * span
          let f = this.f[name]
          if (!f) throw Error(`Can't find field ${name} in fields, please check if the name is not correct between layout and fields`)
          if (f.hidden) continue
          let field = Object.assign({colspan: span,
            labelWidth: this.labelWidth,
            static: col.static || this.static,
          }, f)

          new_r.push(field)
        }
        if (new_r.length > 0)
          r.push(new_r)
      }
      return r
    }
  },

  watch: {
    defaultValue: {
      handler (v) {
        this.merge_object(this.current_value, v)
      },
      deep: true
    },
    current_value: {
      immediate: true,
      handler (v) {
        for(let c in this.value) {
          let name = `${c}${this.staticSuffix}`
          if (this.value[c] === v[c] && this.f.hasOwnProperty(c) && this.value[name] != v[name]) {
            this.$set(this.value, name, v[name])
          }
        }

        // 比较两个变量是否不同
        let result = {}
        this.merge_object(result, deepCompare(this.old_value, this.current_value, true))
        if (!isEmpty(result)) {
          this.$emit('on-query-change', result)
        }
        this.merge_object(this.old_value, this.current_value)
      },
      deep: true
    },
    // TODO 增加当value被清除时，对于defaultValue中有的值，应该置为初始值
    choices: {
      immediate: true,
      handler () {
        for(let field of (this.fields)) {
          let choices = this.choices[field.name]
          if (choices) {
            if (!field.options) {
              this.$set(field, 'options', {choices: choices})
            } else {
              this.$set(field.options, 'choices', choices)
            }
          }
        }
      },
      deep: true
    }
  },

  created () {
    let curValue = {}
    let query_url = new QueryURL()
    if (this.parseUrl)
      curValue = query_url.urlParams

    this.merge_object(this.value, this.defaultValue)
    this.merge_object(this.value, curValue)
    this.merge_object(this.current_value, this.value)
    this.merge_object(this.old_value, this.current_value)
    this.makeFields()
  },

  methods: {
    makeFields () {
      let fields = {}
      for (let f of this.fields) {
        fields[f.name] = f
        //如果type是select，则初始化options
        if (f.type === 'select') {
          if (!f.options) {
            this.$set(f, 'options', {choices: []})
          } else if (!f.options.choices) {
            this.$set(f.options, 'choices', [])
          }
        }
      }
      this.f = fields
    },
    handleTagClose(e, name){
      this.$set(this.current_value, name, reset(this.current_value[name]))
      this.$set(this.current_value, `${name}${this.staticSuffix}`, '')
      this.$set(this.value, name, reset(this.value[name]))
      this.$set(this.value, `${name}${this.staticSuffix}`, '')
    },
    reset () {
        this.reset_object(this.current_value)
        this.merge_object(this.current_value, this.defaultValue)
    },
    handleClick(btn){
      this.value._query_btn = 'submit'
      if (btn.name === 'reset') {
        this.reset()
        this.value._query_btn = 'reset'
      }
      this.handleSubmit()
    },
    getRows(rows) {
      if (this.isShow) return rows
      else {
        return rows.slice(0, this.showLine)
      }
    },
    handleSubmit() {
      this.merge_object(this.value, this.current_value)
      this.$emit("input", this.value)
    }
  }
}
</script>

<style lang="less">
.selectedRow {
  background-color: whitesmoke;
  margin-bottom: 15px;
  padding: 5px;
}

.selectedTag:hover {
  border-color: #da2626 !important;

  i.ivu-icon-ios-close-empty:before {
    color: #ffffff;
    opacity: 1;
  }

  i.ivu-icon-ios-close-empty {
    z-index: 1;
  }
}

.selectedText {
  font-size: 14px; 
  font-weight: bold; 
  color: rgb(70, 76, 91);
}

.selectedTag:hover:after {
  background-color: #da2626 !important;
  width: 22px;
  right: 0;
}

.u-query {
  padding: 0px;

  .line {
    height: 1px;
  }

  .u-query-firstlayout {
    display: inline-block;
    
    &.u-layout-cell {
      width: auto;
    }
  }

  &:before {
    content: "";
    display: block;
    width: 100%;
    box-sizing: border-box;
  }

  .collapse-line {
    text-align: center;
    border-top: 1px solid #eee;
    height: 24px;
    margin-bottom: 10px;

    .showMoreBtn {
      position: absolute;
      border-top: 1px solid white;
      border-left: 1px solid #eee;
      border-right: 1px solid #eee;
      border-bottom: 1px solid #eee;
      padding: 1px 10px;
      -moz-border-radius-bottomleft: 5px;
      -moz-border-radius-bottomright: 5px;
      cursor: pointer;
      margin: 0 auto;
      margin-top: -1px;
      font-size: 12px;
      color: #0000008f;
      left: 50%;
    }

    &:hover {
      border-top: 1px solid red;

      .showMoreBtn {
        color: #ff5d4b;
        border-color: #ff5d4b;
        border-top: 1px solid white;
      }
    }
  }
}
</style>
