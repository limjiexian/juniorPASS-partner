import {
  InboxOutlined,
  PlusCircleOutlined,
  MinusCircleOutlined,
  LeftOutlined,
} from "@ant-design/icons";
import {
  Avatar,
  Button,
  Form,
  Input,
  InputNumber,
  Select,
  Typography,
  Upload,
  TimePicker,
  Tag,
  Row,
  Col,
  Space,
} from "antd";
import { useContext, useEffect, useState } from "react";
import mrt from "../../data/mrt.json";
import day from "../../data/day.json";
import toast from "react-hot-toast";
import TextArea from "antd/es/input/TextArea";
import UserContext from "../UserContext";
import { useNavigate } from "react-router-dom";
import _ from "lodash";

const { Title } = Typography;
const { Dragger } = Upload;

const CreateClass = () => {
  const [list, setList] = useState([]);
  const [addressValue, setAddressValue] = useState();
  const [ageGroup, setAgeGroup] = useState();
  const [categories, setCategories] = useState();
  const [packageTypes, setPackageTypes] = useState();
  const [createClassForm] = Form.useForm();
  const [s3Url, setS3Url] = useState();
  const [mrtStations, setMRTStations] = useState({});
  const [data, setData] = useState([]);
  const [outletSchedules, setOutletSchedules] = useState([]);

  const { user } = useContext(UserContext);
  const navigate = useNavigate();

  // async function getMRTLocations() {
  //   const response = await fetch(
  //     "https://www.onemap.gov.sg/api/auth/post/getToken",
  //     {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify({
  //         email: process.env.REACT_APP_ONEMAPS_EMAIL,
  //         password: process.env.REACT_APP_ONEMAPS_PASSWORD,
  //       }),
  //     }
  //   );
  //   const parseRes = await response.json();
  //   // console.log(parseRes);
  // }

  async function getAgeGroups() {
    try {
      const response = await fetch(
        "http://localhost:5000/misc/getAllAgeGroups",
        {
          method: "GET",
        }
      );
      const parseRes = await response.json();
      setAgeGroup(parseRes);
    } catch (error) {
      console.error("ERROR in fetching getAgeGroups()");
    }
  }

  async function getCategories() {
    const response = await fetch(
      "http://localhost:5000/misc/getAllCategories",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    const parseRes = await response.json();
    setCategories(parseRes);
  }

  async function getPackageTypes() {
    const response = await fetch("http://localhost:5000/misc/getAllPackages", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const parseRes = await response.json();
    setPackageTypes(parseRes);
  }

  const props = {
    name: "file",
    multiple: true,
    fileList: list,
    listType: "picture",
    beforeUpload(info) {
      console.log("info", info);
      setList((state) => [...state, info]);
      return false;
    },
    onDrop(e) {
      console.log("Dropped files", e.dataTransfer.files);
      setList((state) => [...state, e.dataTransfer.files]);
    },
    onRemove(e) {
      const updatedList = list.filter((l) => {
        return l !== e;
      });
      setList(updatedList);
    },
    progress: {
      strokeColor: {
        "0%": "#108ee9",
        "100%": "#87d068",
      },
      size: 3,
      format: (percent) => percent && `${parseFloat(percent.toFixed(2))}%`,
    },
  };

  const handleSelectAgeGroup = (values) => {
    createClassForm.setFieldValue("age_group", values);
  };

  const handleSelectCategory = (values) => {
    createClassForm.setFieldValue("category", values);
  };

  const handleSelectPackage = (values) => {
    createClassForm.setFieldValue("package_types", values);
  };

  const handleSelectFrequency = (values) => {
    createClassForm.setFieldValue("frequency", values);
  };

  async function getS3Url() {
    const response = await fetch("http://localhost:5000/misc/s3url");
    const { url } = await response.json();
    setS3Url(url);
  }

  const handleCreateClass = async (values) => {
    console.log("values", values);
    // manually set file
    // post request to the server to store any extra data

    try {
      // get secure url from our server
      getS3Url();
      // post the image directly to the s3 bucket
      console.log("s3Url", s3Url);
      console.log("list", list);
      await fetch(s3Url, {
        method: "PUT",
        headers: {
          "Content-Type": "multipart/form-data",
        },
        body: list,
      }).then(async (res) => {
        console.log("res", res);
        const { status, url } = res;
        // only create listing if we successfully save image to S3
        if (status === 200) {
          const response = await fetch(
            "http://localhost:5000/listing/createListing",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                ...values,
                partner_id: user.partner_id,
                pictures: url,
              }),
            }
          );
          const parseRes = await response.json();
          console.log("pparese", parseRes);
          if (parseRes) {
            createClassForm.resetFields();
            toast.success("Class has been created successfully");
            navigate("/partner/classes");
          }
        }
      });
    } catch (error) {
      console.error(error.message);
      toast.error("ERROR in creating class. Please try again later.");
    }
  };

  const cleanMRTJSON = () => {
    // clean mrt.json
    mrt.forEach((mrt) => {
      if (mrtStations[mrt["Station Name"]]) {
        const value = mrtStations[mrt["Station Name"]];
        value.push(mrt["Station"]);
        mrtStations[mrt["Station Name"]] = value;
        setMRTStations(mrtStations);
        return;
      }
      mrtStations[mrt["Station Name"]] = [mrt["Station"]];
      setMRTStations(mrtStations);
      return;
    });
  };

  const handleTimeChange = (time) => {
    console.log("time", time);
  };

  useEffect(() => {
    cleanMRTJSON();
    getAgeGroups();
    getCategories();
    getPackageTypes();
  }, []);

  return (
    <>
      <Space
        direction="horizontal"
        style={{
          alignItems: "center",
        }}
      >
        <LeftOutlined
          onClick={() => {
            return navigate(-1);
          }}
        />
        <Title level={3}>Create Class</Title>
      </Space>

      <Form
        name="create-class"
        style={{
          maxWidth: "100%",
        }}
        form={createClassForm}
        onFinish={handleCreateClass}
      >
        <Form.Item
          name="title"
          rules={[
            {
              required: true,
              message: "Please input the class title",
            },
          ]}
        >
          <Input placeholder="Title" size={"large"} required />
        </Form.Item>
        <Form.Item
          name="credit"
          rules={[
            {
              required: true,
              message: "Please input your credit",
            },
          ]}
        >
          <InputNumber
            min={1}
            max={10}
            style={{ width: "100%" }}
            prefix={
              <Avatar
                src={
                  <img
                    src={require("../../images/credit.png")}
                    alt="credit"
                    style={{
                      height: 24,
                      width: 24,
                    }}
                  />
                }
              ></Avatar>
            }
          />
        </Form.Item>
        <Form.Item
          name="packageType"
          rules={[
            {
              required: true,
              message: "Please select the package type",
            },
          ]}
        >
          <Select
            placeholder="Select package type"
            onChange={handleSelectPackage}
            mode="multiple"
          >
            {packageTypes &&
              packageTypes.map((packageType) => (
                <Select.Option
                  key={packageType.id}
                  value={packageType.name}
                ></Select.Option>
              ))}
          </Select>
        </Form.Item>
        <Form.Item
          name="category"
          rules={[
            {
              required: true,
              message: "Please input your category",
            },
          ]}
        >
          <Select
            mode="multiple"
            placeholder="Select category"
            onChange={handleSelectCategory}
          >
            {categories &&
              categories.map((category) => (
                <Select.Option
                  key={category.id}
                  value={category.name}
                ></Select.Option>
              ))}
          </Select>
        </Form.Item>
        <Form.Item
          name="description"
          rules={[
            {
              required: true,
              message: "Please input your description",
            },
          ]}
        >
          <TextArea
            showCount
            maxLength={5000}
            placeholder="Description"
            style={{ height: 120, resize: "none" }}
          />
        </Form.Item>

        {/* dynamic form for multiple outlets */}
        <Form.Item>
          <Form.List
            name="locations"
            rules={[
              {
                validator: async (_, locations) => {
                  if (!locations || locations.length <= 0) {
                    return Promise.reject(new Error("Please pick location"));
                  }
                },
              },
            ]}
          >
            {(fields, { add, remove }, { errors }) => (
              <div
                style={{
                  border: "1px dotted #cccccc",
                  borderRadius: "5px",
                  margin: "12px 0",
                  padding: "12px ",
                }}
              >
                <Form.Item>
                  <Button
                    type="dashed"
                    onClick={() => add()}
                    icon={<PlusCircleOutlined />}
                  >
                    Add location(s)
                  </Button>
                  <Form.ErrorList errors={errors} />
                </Form.Item>

                <Col>
                  <Row gutter={16}>
                    <Col span={1}>
                      <div>Index</div>
                    </Col>
                    <Col span={13}>
                      <div>Location(s)</div>
                    </Col>
                    <Col span={6}>
                      <div>Schedule(s)</div>
                    </Col>
                  </Row>

                  {fields.map((field, index) => (
                    <Row>
                      <Col flex="1 0 50%">
                        <Row
                          key={`location-${field.key}`}
                          style={{
                            marginBottom: 8,
                            border: "1px dotted #cccccc",
                            padding: "8px",
                          }}
                        >
                          <Col span={1}>{index}</Col>
                          <Col span={13} flex="1 0 50%">
                            <Row>
                              <Col flex="1 0 50%">
                                <Form.Item
                                  name={[field.name, "address"]}
                                  fieldId={[field.fieldId, "address"]}
                                  rules={
                                    [
                                      // {
                                      //   required: true,
                                      //   message: "Please input your address",
                                      // },
                                    ]
                                  }
                                >
                                  <Select
                                    showSearch
                                    value={addressValue?.ADDRESS}
                                    placeholder={"Address"}
                                    filterOption={false}
                                    onSearch={async (value) => {
                                      const response = await fetch(
                                        `https://www.onemap.gov.sg/api/common/elastic/search?searchVal=${value}&returnGeom=Y&getAddrDetails=Y&pageNum=`
                                      );
                                      const parseRes = await response.json();
                                      setData(parseRes.results);
                                    }}
                                    onChange={(newValue, selectedGG) => {
                                      setAddressValue(selectedGG.valueObject);
                                      // createClassForm.setFieldValue(
                                      //   "address",
                                      //   selectedGG.valueObject
                                      // );

                                      // TODO: set to outletSchedules
                                      const stringJson = outletSchedules;
                                      stringJson[index] = {
                                        ...stringJson[index],
                                        address: selectedGG.valueObject,
                                        schedules: [],
                                      };
                                      setOutletSchedules(stringJson);

                                      console.log(
                                        "outletscheudle after address set",
                                        outletSchedules
                                      );
                                    }}
                                    notFoundContent={null}
                                    options={(data || []).map((d) => ({
                                      value: d.ADDRESS,
                                      label: d.ADDRESS,
                                      valueObject: d,
                                    }))}
                                  />
                                </Form.Item>
                              </Col>
                              <Col flex="1 0 50%">
                                <Form.Item
                                  name={[field.name, "nearest_mrt"]}
                                  fieldId={[field.fieldId, "nearest_mrt"]}
                                  rules={[
                                    {
                                      required: true,
                                      message: "Please input the nearest MRT",
                                    },
                                  ]}
                                >
                                  <Select
                                    showSearch
                                    placeholder="Nearest MRT"
                                    onChange={(value) => {
                                      const stringJson = outletSchedules;
                                      stringJson[index] = {
                                        ...stringJson[index],
                                        nearest_mrt: value,
                                      };
                                      setOutletSchedules(stringJson);

                                      console.log(
                                        "after replace",
                                        outletSchedules
                                      );
                                    }}
                                  >
                                    {!_.isEmpty(mrtStations) &&
                                      Object.keys(mrtStations).map(
                                        (key, index) => {
                                          return (
                                            <Select.Option
                                              key={index}
                                              value={key}
                                              label={key}
                                            >
                                              {mrtStations[key].map((stat) => {
                                                var conditionalRendering = [];
                                                if (stat.includes("NS")) {
                                                  conditionalRendering.push(
                                                    <Tag color="#d5321a">
                                                      {stat}
                                                    </Tag>
                                                  );
                                                } else if (
                                                  stat.includes("EW") ||
                                                  stat.includes("CG")
                                                ) {
                                                  conditionalRendering.push(
                                                    <Tag color="#079546">
                                                      {stat}
                                                    </Tag>
                                                  );
                                                } else if (
                                                  stat.includes("CC")
                                                ) {
                                                  conditionalRendering.push(
                                                    <Tag color="#f79910">
                                                      {stat}
                                                    </Tag>
                                                  );
                                                } else if (
                                                  stat.includes("TE")
                                                ) {
                                                  conditionalRendering.push(
                                                    <Tag color="#a45724">
                                                      {stat}
                                                    </Tag>
                                                  );
                                                } else if (
                                                  stat.includes("NE")
                                                ) {
                                                  conditionalRendering.push(
                                                    <Tag color="#9d07ad">
                                                      {stat}
                                                    </Tag>
                                                  );
                                                } else if (
                                                  stat.includes("DT")
                                                ) {
                                                  conditionalRendering.push(
                                                    <Tag color="#085ec4">
                                                      {stat}
                                                    </Tag>
                                                  );
                                                }
                                                return conditionalRendering;
                                              })}
                                              {key}
                                            </Select.Option>
                                          );
                                        }
                                      )}
                                  </Select>
                                </Form.Item>
                              </Col>
                            </Row>
                          </Col>
                          {/* dynamic form for multiple schedules */}
                          <Col flex="1 0 25%">
                            <Form.Item>
                              <Form.List
                                name={[field.name, "schedules"]}
                                rules={[
                                  {
                                    validator: async (_, schedules) => {
                                      if (!schedules || schedules.length <= 0) {
                                        return Promise.reject(
                                          new Error("Please pick dates")
                                        );
                                      }
                                    },
                                  },
                                ]}
                              >
                                {(times, { add, remove }, { errors }) => (
                                  <div
                                    style={{
                                      border: "1px dotted #cccccc",
                                      borderRadius: "5px",
                                      padding: "12px",
                                    }}
                                  >
                                    {times.map((time, index2) => (
                                      <div
                                        key={`schedule-${time.key}`}
                                        style={{
                                          display: "flex",
                                          marginBottom: 8,
                                        }}
                                        align="start"
                                      >
                                        <Form.Item
                                          name={[time.name, "day"]}
                                          fieldId={[time.fieldId, "day"]}
                                          rules={[
                                            {
                                              required: true,
                                              message: "Missing day",
                                            },
                                          ]}
                                        >
                                          <Select
                                            placeholder="Select day"
                                            onSelect={(value) => {
                                              var stringJson = outletSchedules;

                                              if (
                                                _.isEmpty(
                                                  stringJson[index].schedules
                                                )
                                              ) {
                                                stringJson[index].schedules[
                                                  value
                                                ] = [];
                                              } else {
                                                stringJson[index].schedules[
                                                  value
                                                ] = [
                                                  ...stringJson[index]
                                                    .schedules,
                                                  (stringJson[index].schedules[
                                                    value
                                                  ] = []),
                                                ];
                                              }
                                              setOutletSchedules(stringJson);
                                            }}
                                          >
                                            {day &&
                                              day.map((d, index) => (
                                                <Select.Option
                                                  key={index}
                                                  value={d}
                                                ></Select.Option>
                                              ))}
                                          </Select>
                                        </Form.Item>
                                        <Form.Item
                                          name={[time.name, "timeslot"]}
                                          fieldId={[time.fieldId, "timeslot"]}
                                          rules={[
                                            {
                                              required: true,
                                              message: "Missing timeslots",
                                            },
                                          ]}
                                        >
                                          <TimePicker.RangePicker
                                            format={"HH:mm"}
                                            minuteStep={15}
                                            onChange={handleTimeChange}
                                          />
                                        </Form.Item>
                                        <Form.Item
                                          name={[time.name, "frequency"]}
                                          fieldId={[time.fieldId, "frequency"]}
                                          rules={[
                                            {
                                              required: true,
                                              message: "Missing frequency",
                                            },
                                          ]}
                                        >
                                          <Select
                                            placeholder="Select frequency"
                                            onSelect={handleSelectFrequency}
                                            options={[
                                              {
                                                value: "Biweekly",
                                                label: "Biweekly",
                                              },
                                              {
                                                value: "Weekly",
                                                label: "Weekly",
                                              },
                                              {
                                                value: "Monthly",
                                                label: "Monthly",
                                              },
                                            ]}
                                          ></Select>
                                        </Form.Item>
                                        <Form.Item
                                          style={{
                                            margin: "0 4px",
                                          }}
                                        >
                                          {times.length > 1 ? (
                                            <MinusCircleOutlined
                                              onClick={() => {
                                                console.log(time.name);
                                                remove(time.name);
                                              }}
                                            />
                                          ) : null}
                                        </Form.Item>
                                      </div>
                                    ))}
                                    <Form.Item>
                                      <Button
                                        type="dashed"
                                        onClick={() => {
                                          add();
                                        }}
                                        icon={<PlusCircleOutlined />}
                                      >
                                        Add schedule
                                      </Button>
                                      <Form.ErrorList errors={errors} />
                                    </Form.Item>
                                  </div>
                                )}
                              </Form.List>
                            </Form.Item>
                          </Col>
                        </Row>
                      </Col>
                      <Col>
                        <Form.Item>
                          {fields.length > 1 ? (
                            <MinusCircleOutlined
                              onClick={() => remove(field.name)}
                            />
                          ) : null}
                        </Form.Item>
                      </Col>
                    </Row>
                  ))}
                </Col>
              </div>
            )}
          </Form.List>
        </Form.Item>

        <Form.Item
          name={"age_group"}
          rules={[
            {
              required: true,
              message: "Please input your category",
            },
          ]}
        >
          <Select
            mode="multiple"
            optionLabelProp="name"
            placeholder="Select age group"
            onChange={handleSelectAgeGroup}
          >
            {ageGroup &&
              ageGroup.map((age, index) => (
                <Select.Option
                  key={age.id}
                  value={
                    age.max_age !== null
                      ? `${age.min_age} to ${age.max_age} years old: ${age.name}`
                      : `${age.name} years old`
                  }
                  label={age.name}
                ></Select.Option>
              ))}
          </Select>
        </Form.Item>
        <Dragger {...props}>
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">
            Click or drag file to this area to upload
          </p>
          <p className="ant-upload-hint"></p>
        </Dragger>
        <Button type="primary" htmlType="submit" style={{ width: "100%" }}>
          Create
        </Button>
      </Form>
    </>
  );
};

export default CreateClass;
