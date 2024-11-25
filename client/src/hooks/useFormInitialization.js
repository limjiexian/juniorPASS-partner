import { useEffect } from "react";

const parseAddress = (address) => {
  try {
    const parsed = JSON.parse(address);
    return parsed.ADDRESS || address;
  } catch {
    return address; // Return original if parsing fails
  }
};

const useFormInitialization = (form, list) => {
  useEffect(() => {
    if (!list) return;

    const locations = list?.outlets.map((outlet) => ({
      address: parseAddress(outlet.address),
      nearest_mrt: outlet.nearest_mrt,
      schedules: outlet.schedules.map((schedule) => ({
        day: schedule.day,
        timeslot: schedule.timeslot,
        frequency: schedule.frequency,
      })),
    }));

    console.log(locations);

    // Initialize form values
    form.setFieldsValue({
      title: list?.listing_title,
      credit: list?.credit,
      description: list?.description,
      package_types: list?.package_types,
      category: list?.categories,
      age_groups: list?.age_groups,
      locations,
    });
  }, [form, list]);
};

export default useFormInitialization;
