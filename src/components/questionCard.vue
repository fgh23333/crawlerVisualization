<template>
  <div id="questionCard">
    <div v-if="list == ''">暂无数据</div>
    <div v-else>
      <div class="header" v-if="subjectShow.includes(lesson)">
        <div class="breadCrumb" v-if="subjectShow.includes(lesson) && !onSearch">
          {{ subjectList[lesson] }} - {{ questionType[type] }} - 共{{ list.length }}题
        </div>
        <div class="breadCrumb" v-if="subjectShow.includes(lesson) && onSearch">
          {{ subjectList[lesson] }} - {{ questionType[type] }} - 搜索结果共{{ showList.length }}题
        </div>
        <div class="rightplace">
          <!--          搜索框-->
          <el-input class="input" placeholder="搜题（回车以搜索）" v-model="searchWord" @change="search" @input="changeInput"
            clearable>
          </el-input>
          <!--          更多功能-下拉菜单-导出pdf-->
          <el-dropdown placement="bottom" class="dropdown" @command="handleCommand">
            <el-button icon="el-icon-s-operation" type="text" size="medium">更多功能</el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="savePDF">导出PDF</el-dropdown-item>
                <el-dropdown-item command="printPDF">打印题库</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
      <div v-if="showList == '' && onSearch">
        <el-empty description="搜索结果为空"></el-empty>
      </div>
      <div class="questionCover" v-for="(item, i) in showList" :key="i">
        <div class="questionTypeCover" v-if="showList[i].option.length == 2">
          <div class="left">
            <span class="seq">{{ i + 1 }}</span>
          </div>
          <div class="right">
            <div class="markAndLike">
              <transition name="fade" mode="out-in">
                <img class="mark"
                  :src="showList[i].markFlag ? require('@/assets/icon/icon-mark-active.svg') : require('@/assets/icon/icon-mark.svg')"
                  @click="changeFlagIcon('markFlag', i)" :key="item.markFlag">
              </transition>
              <transition name="fade" mode="out-in">
                <img class="like"
                  :src="showList[i].likeFlag ? require('@/assets/icon/icon-like-active.svg') : require('@/assets/icon/icon-like.svg')"
                  @click="changeFlag('likeFlag', i)" :key="item.likeFlag">
              </transition>
            </div>
            <div class="questionType">
              <span v-if="$route.path == '/newHome/favorites'">
                {{ abbreviationSubjectList[showList[i].abbreviationSubject] }} -
              </span>
              <span>判断</span>
            </div>
            <div class="questionStem">{{ showList[i].questionStem }}</div>
            <div class="questionAnswer">
              <span class="colorBefore"></span>
              <span class="correctAnswer">正确答案：</span>
              <span class="true" v-if="showList[i].answer == '正确'">{{ showList[i].answer }}</span>
              <span class="false" v-if="showList[i].answer == '错误'">{{ showList[i].answer }}</span>
            </div>
          </div>
        </div>
        <div class="questionTypeCover" v-if="showList[i].option == ''">
          <div class="left">
            <span class="seq">{{ i + 1 }}</span>
          </div>
          <div class="right">
            <div class="markAndLike">
              <transition name="fade" mode="out-in">
                <img class="mark"
                  :src="showList[i].markFlag ? require('@/assets/icon/icon-mark-active.svg') : require('@/assets/icon/icon-mark.svg')"
                  @click="changeFlagIcon('markFlag', i)" :key="item.markFlag">
              </transition>
              <transition name="fade" mode="out-in">
                <img class="like"
                  :src="showList[i].likeFlag ? require('@/assets/icon/icon-like-active.svg') : require('@/assets/icon/icon-like.svg')"
                  @click="changeFlag('likeFlag', i)" :key="item.likeFlag">
              </transition>
            </div>
            <div class="questionType">
              <span v-if="$route.path == '/newHome/favorites'">
                {{ abbreviationSubjectList[showList[i].abbreviationSubject] }} -
              </span>
              <span>填空</span>
            </div>
            <div class="questionStem">{{ showList[i].questionStem }}</div>
            <div class="questionAnswer">
              <span class="colorBefore"></span>
              <span class="correctAnswer">正确答案：</span>
              <span class="answer">{{ showList[i].answer }}</span>
            </div>
          </div>
        </div>
        <div class="questionTypeCover" v-if="showList[i].option.length == 4 && showList[i].answer.length == 1">
          <div class="left">
            <span class="seq">{{ i + 1 }}</span>
          </div>
          <div class="right">
            <div class="markAndLike">
              <transition name="fade" mode="out-in">
                <img class="mark"
                  :src="showList[i].markFlag ? require('@/assets/icon/icon-mark-active.svg') : require('@/assets/icon/icon-mark.svg')"
                  @click="changeFlagIcon('markFlag', i)" :key="item.markFlag">
              </transition>
              <transition name="fade" mode="out-in">
                <img class="like"
                  :src="showList[i].likeFlag ? require('@/assets/icon/icon-like-active.svg') : require('@/assets/icon/icon-like.svg')"
                  @click="changeFlag('likeFlag', i)" :key="item.likeFlag">
              </transition>
            </div>
            <div class="questionType">
              <span v-if="$route.path == '/newHome/favorites'">
                {{ abbreviationSubjectList[showList[i].abbreviationSubject] }} -
              </span>
              <span>单选</span>
            </div>
            <div class="questionStem">{{ showList[i].questionStem }}</div>
            <div class="questionOpt">
              <div class="option" v-for="(item, k) in showList[i].option" :key="k">
                <div class="dot"></div>
                <div class="optText">{{ options[k] }}、{{ showList[i].option[k] }}</div>
              </div>
            </div>
            <div class="questionAnswer">
              <span class="colorBefore"></span>
              <span class="correctAnswer">正确答案：</span>
              <span class="answer">{{ showList[i].answer }}</span>
            </div>
          </div>
        </div>
        <div class="questionTypeCover" v-if="showList[i].option.length > 3 && showList[i].answer.length > 1">
          <div class="left">
            <span class="seq">{{ i + 1 }}</span>
          </div>
          <div class="right">
            <div class="markAndLike">
              <transition name="fade" mode="out-in">
                <img class="mark"
                  :src="showList[i].markFlag ? require('@/assets/icon/icon-mark-active.svg') : require('@/assets/icon/icon-mark.svg')"
                  @click="changeFlagIcon('markFlag', i)" :key="item.markFlag">
              </transition>
              <transition name="fade" mode="out-in">
                <img class="like"
                  :src="showList[i].likeFlag ? require('@/assets/icon/icon-like-active.svg') : require('@/assets/icon/icon-like.svg')"
                  @click="changeFlag('likeFlag', i)" :key="item.likeFlag">
              </transition>
            </div>
            <div class="questionType">
              <span v-if="$route.path == '/newHome/favorites'">
                {{ abbreviationSubjectList[showList[i].abbreviationSubject] }} -
              </span>
              <span>多选</span>
            </div>
            <div class="questionStem">{{ showList[i].questionStem }}</div>
            <div class="questionOpt">
              <div class="option" v-for="(item, k) in showList[i].option" :key="k">
                <div class="dot"></div>
                <div class="optText">{{ options[k] }}、{{ showList[i].option[k] }}</div>
              </div>
            </div>
            <div class="questionAnswer">
              <span class="colorBefore"></span>
              <span class="correctAnswer">正确答案：</span>
              <span class="answer">{{ showList[i].answer }}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="bottomAlert" v-if="showList.length !== 0">--- 已经到底啦 ---</div>
    </div>
  </div>
</template>

<script>
import { mapActions } from "vuex";
import Fuse from 'fuse.js';
import axios from "axios";
import pdfMake from "pdfmake/build/pdfmake";

export default {
  data() {
    return {
      searchWord: "",  //搜索框内容
      list: [], //这个是此题库所有的题目列表
      showList: [],  //这个是渲染在页面上的题目列表
      onSearch: false,  //值为true表示显示搜索结果
      options: ['A', 'B', 'C', 'D', 'E'],
      subjectList: {
        'Marx': '马克思主义基本原理',
        'XiIntro': '习近平新时代中国特色社会主义思想概论',
        'CMH': '中国近现代史纲要',
        'Political': '思想道德与法治',
        'MaoIntro': '毛泽东思想和中国特色社会主义理论体系概论',
        'CCPH': '中国共产党历史',
        'ORH': '改革开放史',
        'SDH': '社会主义发展史',
        'NCH': '新中国史'
      },
      questionType: {
        'subject': '总题库',
        'rightWrong': '判断题',
        'singleChoice': '单选题',
        'multipleChoice': '多选题',
        'fillingBlank': '填空题'
      },
      lesson: '',
      type: '',
      subjectShow: ['Marx', 'XiIntro', 'CMH', 'Political', 'MaoIntro', 'CCPH', 'ORH', 'SDH', 'NCH'],
      abbreviationSubjectList: {
        'Marx': '马原',
        'CMH': '近代史',
        'Political': '思政',
        'MaoIntro': '毛概',
        'XiIntro': '习概',
        'SDH': '社主史',
        'NCH': '新中国史',
        'CCPH': '党史',
        'ORH': '改开史'
      }
    }
  },
  props: {
    subjectOptions: {
      type: String,
      default: 'all'
    }
  },
  created() {
    this.lesson = this.$route.params.lesson;
    this.type = this.$route.params.type;
    if (this.$route.path == "/newHome/favorites") {
      this.list = this.$store.state.likeList
    } else {
      this.list = require(`../assets/${this.lesson}_${this.type}.json`);
      if (this.$store.state.wrongQuestions !== '' || this.$store.state.likeList !== '') {
        this.$store.state.wrongQuestions.forEach(subsetItem => {
          let supersetItem = this.list.find(supersetItem => supersetItem.id == subsetItem.id);
          if (supersetItem) {
            supersetItem.likeFlag = true;
          }
        });
        this.$store.state.likeList.forEach(subsetItem => {
          let supersetItem = this.list.find(supersetItem => supersetItem.id == subsetItem.id);
          if (supersetItem) {
            supersetItem.likeFlag = true;
          }
        });
      }
    }
    this.showList = [...this.list]
    this.searchWord = ""
    this.onSearch = false
  },
  watch: {
    subjectOptions: {
      handler(newValue, oldValue) {
        if (this.$route.path == '/newHome/favorites') {
          switch (newValue) {
            case 'all':
              this.list = [...new Set([...this.$store.state.likeList, ...this.$store.state.wrongQuestions])]
              this.showList = [...this.list]
              break
            case 'favorites':
              this.list = this.$store.state.likeList
              this.showList = [...this.list]
              break
            case 'wrong':
              this.list = this.$store.state.wrongQuestions
              this.showList = [...this.list]
              break
            default:
              return
          }
        } else {
          return
        }
      }
    },
    '$route': function (to, from) {
      this.lesson = to.params.lesson;
      this.type = to.params.type;
      if (this.$route.path == "/newHome/favorites") {
        this.list = this.$store.state.likeList
      } else {
        this.list = require(`../assets/${this.lesson}_${this.type}.json`);
        if (this.$store.state.wrongQuestions !== '' || this.$store.state.likeList !== '') {
          this.$store.state.wrongQuestions.forEach(subsetItem => {
            let supersetItem = this.list.find(supersetItem => supersetItem.id == subsetItem.id);
            if (supersetItem) {
              supersetItem.likeFlag = true;
            }
          });
          this.$store.state.likeList.forEach(subsetItem => {
            let supersetItem = this.list.find(supersetItem => supersetItem.id == subsetItem.id);
            if (supersetItem) {
              supersetItem.likeFlag = true;
            }
          });
        }
      }
      this.showList = [...this.list]
      this.searchWord = ""
      this.onSearch = false
    }
  },
  methods: {
    handleCommand(e) {
      if (e === "savePDF") {
        this.testMakePDF("save")
      }
      if (e === "printPDF") {
        this.testMakePDF("print")
      }
    },
    formatDateTime() {
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');

      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    },
    async testMakePDF(method) {
      const response = await axios.get('https://fonts.635262140.xyz/vfs_fonts.js', {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*', // 适用于跨域请求
        }
      });
      // 使用 eval 将字体文件内容解析并赋值给 pdfMake.vfs
      const vfsFonts = eval(response.data); // 请确保来源可信
      pdfMake.vfs = vfsFonts.pdfMake ? vfsFonts.pdfMake.vfs : vfsFonts;

      // 定义字体
      pdfMake.fonts = {
        // webfont是字体名，可以自定义，下面需要用这个名字配置字体
        webfont: {
          // FZYTK.TTF 这个文件已经在 我们生成的 vfs_font.js 文件中，且已经引入，所以可以直接使用
          normal: "MiSans-Medium.ttf",
          bold: "MiSans-Heavy.ttf",
          italics: "MiSans-Medium.ttf",
          bolditalics: "MiSans-Medium.ttf",
        }
      };
      // console.log(this.showList)
      let temp = [];
      let title = "题库";

      if (this.subjectShow.includes(this.lesson) && this.onSearch) {
        title = `${this.subjectList[this.lesson]} - ${this.questionType[this.type]} - '${this.searchWord}'搜索结果共${this.showList.length}题`
        temp.push({
          text: title,
          fontSize: 16
        })

      }
      if (this.subjectShow.includes(this.lesson) && !this.onSearch) {
        title = `${this.subjectList[this.lesson]} - ${this.questionType[this.type]} - 共${this.list.length}题`
        temp.push({
          text: title,
          fontSize: 16
        });
      }
      temp.push({
        text: this.formatDateTime(),
        fontSize: 10
      });
      temp.push({
        text: `题库网站：https://bank.635262140.xyz/newHome`,
        fontSize: 10
      });
      temp.push({
        text: "\n"
      })
      this.showList.forEach((item, index) => {
        if (item.option.length == 2) {
          temp.push({
            text: index + 1 + "、[判断]" + item.questionStem, fontSize: 14
          })
          temp.push({
            text: "\t答案 | " + item.answer, fontSize: 14
          })
        } else if (item.option.length > 3 && item.answer.length > 1) {
          temp.push({
            text: index + 1 + "、[多选]" + item.questionStem, fontSize: 14
          })
          item.option.forEach((item, index) => {
            temp.push({
              text: "\t" + this.options[index] + "  " + item, fontSize: 14
            })
          })
          temp.push({
            text: "\t答案 | " + item.answer, fontSize: 14
          })
        } else if (item.option.length == 4 && item.answer.length == 1) {
          temp.push({
            text: index + 1 + "、[单选]" + item.questionStem, fontSize: 14
          })
          item.option.forEach((item, index) => {
            temp.push({
              text: "\t" + this.options[index] + "  " + item, fontSize: 14
            })
          })
          temp.push({
            text: "\t答案 | " + item.answer, fontSize: 14
          })
        } else if (item.option == '') {
          temp.push({
            text: index + 1 + "、[填空]" + item.questionStem, fontSize: 14
          })
          temp.push({
            text: "\t答案 | " + item.answer, fontSize: 14
          })
        }
        temp.push({
          text: "\n"
        })
      })
      // console.log(temp)
      var docDefinition = {
        content: temp,
        defaultStyle: {
          // 设置我们定义的字体为默认字体
          font: "webfont",
        },
      };
      if (method === "save") {
        pdfMake.createPdf(docDefinition).download(title, () => {
          console.log("complete");
        });
      }
      if (method === "print") {
        pdfMake.createPdf(docDefinition).print();
      }

    },
    ...mapActions(['addLikeQuestion', 'removeLikeQuestion', 'addFavoriteQuestion', 'removeFavoriteQuestion']),
    changeFlag(flagType, i) {
      this.showList[i][flagType] = !this.showList[i][flagType]
      if (this.$route.path == '/newHome/favorites') {
        if (this.subjectOptions == 'favorites') {
          if (this.showList[i][flagType]) {
            this.addLikeQuestion(this.showList[i])
          } else {
            this.removeLikeQuestion(this.showList[i].id)
            this.list = this.$store.state.likeList
            this.showList = [...this.list]
          }
        } else if (this.subjectOptions == 'wrong') {
          if (this.showList[i][flagType]) {
            this.addFavoriteQuestion(this.showList[i])
          } else {
            this.removeFavoriteQuestion(this.showList[i].id)
            this.list = this.$store.state.wrongQuestions
            this.showList = [...this.list]
          }
        } else {
          if (this.showList[i][flagType]) {
            this.addLikeQuestion(this.showList[i])
          } else {
            this.removeLikeQuestion(this.showList[i].id)
            this.removeFavoriteQuestion(this.showList[i].id)
            this.list = [...new Set([...this.$store.state.likeList, ...this.$store.state.wrongQuestions])]
            this.showList = [...this.list]
          }
        }
      } else {
        if (this.showList[i][flagType]) {
          this.addLikeQuestion(this.showList[i])
        } else {
          this.removeLikeQuestion(this.showList[i].id)
          this.removeFavoriteQuestion(this.showList[i].id)
        }
      }
    },
    changeFlagIcon(flagType, i) {
      this.showList[i][flagType] = !this.showList[i][flagType]
    },
    changeInput() {
      if (this.$route.path == '/newHome/favorites') {
        return
      } else {
        if (this.searchWord === "") {
          this.showList = [...this.list]
          this.onSearch = false
        }
      }
    },
    search() {
      const fuseOptions = {
        keys: ['questionStem']
      };
      const fuse = new Fuse(this.list, fuseOptions);
      let temp = this.searchWord ? fuse.search(this.searchWord).map(result => result.item) : this.list;
      this.showList = [...temp]
      this.onSearch = this.searchWord === "" ? false : true
    }
  }
}
</script>

<style lang="less">
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s;
}

.fade-enter,
.fade-leave-to {
  opacity: 0;
}

#questionCard {
  .header {
    display: flex;
    justify-content: space-between;
    margin: 10px 34rpx;
    //padding-left: 30px;
    align-items: center;
    height: 68px;

    .rightplace {
      margin-right: 30px;

      .input {
        width: 500px;
        margin-right: 20px;
      }
    }


    .breadCrumb {
      color: #898799;
      font-size: 18px;
      font-weight: 500;
      text-align: left;
      line-height: 68px;
      font-family: 思源黑体;
      margin-left: 34px;
      height: 68px;
    }
  }


  .questionCover {
    background-color: #FFFFFF;
    padding: 14px 18px;
    margin: 15px 34px;
    border-radius: 24px;
    box-shadow: 0px -1px 8px 0px rgba(230, 232, 240, 0.9),
      -1px 0px 8px 0px rgba(230, 232, 240, 0.9),
      1px 0px 8px 0px rgba(230, 232, 240, 0.9),
      0px 1px 8px 0px rgba(230, 232, 240, 0.9);

    .questionTypeCover {
      font-family: HarmonyOS Sans SC;
      display: flex;
      justify-content: flex-start;

      .left {
        width: fit-content;
        margin-right: 10px;

        .seq {
          height: 30px;
          font-size: 20px;
          font-weight: bold;
          color: white;
          background-color: #6C5DD3;
          border-radius: 10px;
          padding: 0px 10px;
          line-height: 30px;
          display: inline-block;
        }
      }

      .right {
        text-align: justify;
        position: relative;
        width: 94%;

        .markAndLike {
          width: 72px;
          height: 32px;
          position: absolute;
          top: 0px;
          right: 0px;

          .mark {
            display: inline-block;
            margin-right: 8px;
          }

          .like {
            display: inline-block;
          }
        }

        .questionType {
          letter-spacing: 3px;
          height: 30px;
          line-height: 30px;
          font-size: 18px;
          font-weight: bold;
          color: #877BD1;
          margin-bottom: 10px;
        }

        .questionStem {
          font-weight: 500;
          letter-spacing: 1px;
          font-size: 18px;
          margin-bottom: 4px;
          line-height: 30px;
        }

        .questionOpt {
          .option {
            line-height: 28px;
            font-size: 18px;
            letter-spacing: 1px;
            position: relative;

            .dot {
              width: 14px;
              height: 14px;
              border-radius: 50%;
              background-color: #6C5DD3;
              position: absolute;
              top: 7px;
            }

            .optText {
              text-indent: 22px;
            }
          }
        }

        .questionAnswer {
          letter-spacing: 1px;
          height: 30px;
          line-height: 30px;
          margin-top: 18px;
          display: flex;
          justify-content: flex-start;
          margin-bottom: 10px;

          .colorBefore {
            background-color: #6C5DD3;
            width: 8px;
            height: 30px;
            display: inline-block;
            border-radius: 4px;
            margin-right: 4px;
          }

          .correctAnswer {
            color: #707070;
            display: inline-block;
            height: 30px;
            line-height: 30px;
            font-size: 18px;
          }

          .false {
            color: #FF3B3B;
            display: inline-block;
            height: 30px;
            line-height: 30px;
            font-size: 18px;
          }

          .true {
            color: #0BDE00;
            display: inline-block;
            height: 30px;
            line-height: 30px;
            font-size: 18px;
          }

          .answer {
            display: inline-block;
            height: 30px;
            line-height: 30px;
            font-size: 18px;
            color: #5F89D3;
          }
        }
      }
    }
  }

  .bottomAlert {
    color: #999;
    font-size: 16px;
    margin-top: 40px;
    margin-bottom: 40px;
    line-height: 40px;
    height: 40px;
  }
}
</style>